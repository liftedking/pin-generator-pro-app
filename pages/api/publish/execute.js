import { getRandomReadyPin, getCategory, getUser, deletePin, updateCategory, writeLog } from "../../../firebase/db";
import { describeImage, generatePinContent } from "../../../lib/huggingface";
import { publishPin } from "../../../lib/pinterest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Verify this request is from our cron service
  const cronSecret = req.headers["x-cron-secret"];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { categoryId, userId } = req.body;
  if (!categoryId || !userId) {
    return res.status(400).json({ error: "categoryId and userId required" });
  }

  try {
    // 1. Get category and user
    const [category, user] = await Promise.all([
      getCategory(categoryId),
      getUser(userId),
    ]);

    if (!category) return res.status(404).json({ error: "Category not found" });
    if (!user?.accessToken) return res.status(401).json({ error: "No Pinterest token" });

    // 2. Pick a random ready pin from this category
    const pin = await getRandomReadyPin(categoryId);
    if (!pin) {
      await writeLog({
        type: "publish_skipped",
        userId,
        categoryId,
        categoryName: category.categoryName,
        reason: "No ready pins available",
      });
      return res.status(200).json({ skipped: true, reason: "No ready pins" });
    }

    // 3. Describe the image with AI vision
    let imageDescription = pin.imageAlt || "";
    try {
      imageDescription = await describeImage(pin.imageUrl);
    } catch (e) {
      console.warn("Image description failed, using alt text:", e.message);
    }

    // 4. Generate unique title, description, hashtags
    const cta = pin.assignedCta || category.cta || "link_in_bio";
    const content = await generatePinContent({
      imageDescription,
      categoryName: category.categoryName,
      keywords: category.keywords,
      cta,
      fallbackTitle: category.fallbackTitle,
      fallbackDescription: pin.customDescription || category.fallbackDescription,
    });

    // 5. Determine destination link
    const link = pin.assignedLink !== undefined ? pin.assignedLink : category.destinationLink;

    // 6. Build full description with hashtags
    const hashtagString = content.hashtags
      ?.map((h) => (h.startsWith("#") ? h : `#${h}`))
      .join(" ");
    const fullDescription = `${content.description}${hashtagString ? " " + hashtagString : ""}`;

    // 7. Publish to Pinterest
    const published = await publishPin(user.accessToken, {
      boardId: category.boardId,
      title: content.title,
      description: fullDescription,
      imageUrl: pin.imageUrl,
      link: link || undefined,
      altText: imageDescription || pin.imageAlt,
    });

    // 8. Delete pin from Firebase
    await deletePin(pin.id);
    const newPinCount = Math.max(0, (category.pinCount || 1) - 1);
    await updateCategory(categoryId, {
      pinCount: newPinCount,
      lastPublishedAt: new Date().toISOString(),
    });

    // 9. Check auto-generate threshold
    if (category.autoGenerate && newPinCount <= (category.autoGenerateThreshold || 10)) {
      try {
        // Fire auto-generate in background (don't await — don't block publish response)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pins/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-secret": process.env.CRON_SECRET,
          },
          body: JSON.stringify({
            categoryId,
            count: category.autoGenerateCount || 30,
            _internal: true,
          }),
        }).catch((e) => console.warn("Auto-generate failed:", e.message));
      } catch (e) {
        console.warn("Auto-generate trigger failed:", e.message);
      }
    }

    // 10. Log the publish
    await writeLog({
      type: "publish_success",
      userId,
      categoryId,
      categoryName: category.categoryName,
      pinId: pin.id,
      pinterestPinId: published.id,
      title: content.title,
      imageUrl: pin.imageUrl,
    });

    res.status(200).json({
      success: true,
      pinterestPinId: published.id,
      title: content.title,
    });
  } catch (err) {
    console.error("Publish execute error:", err);

    await writeLog({
      type: "publish_error",
      userId,
      categoryId,
      error: err.message,
    }).catch(() => {});

    res.status(500).json({ error: err.message });
  }
}
