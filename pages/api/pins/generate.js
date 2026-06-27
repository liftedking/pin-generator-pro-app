import { requireAuth } from "../../../lib/session";
import { getCategory, createPin, updateCategory } from "../../../firebase/db";
import { expandKeywords, suggestLayout, suggestFont } from "../../../lib/huggingface";
import { searchPhotosMany } from "../../../lib/pexels";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { categoryId, count = 10 } = req.body;

  if (!categoryId) return res.status(400).json({ error: "categoryId required" });
  if (count < 1 || count > 100) return res.status(400).json({ error: "count must be 1-100" });

  try {
    const category = await getCategory(categoryId);
    if (!category || category.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 1. Expand keywords for better Pexels results
    const searchPhrases = await expandKeywords(category.userInput);
    const primaryQuery = searchPhrases[0] || category.userInput;

    // 2. Fetch images from Pexels
    const photos = await searchPhotosMany(primaryQuery, count);

    if (!photos.length) {
      return res.status(404).json({ error: "No images found for this topic. Try different keywords." });
    }

    // 3. For each photo, determine layout and design params
    const pins = [];
    for (const photo of photos.slice(0, count)) {
      // AI suggests layout based on image (we use category name as proxy to save API calls)
      const layout = await suggestLayout(photo.alt || category.categoryName, category.categoryName);

      const pin = await createPin({
        userId: session.userId,
        categoryId,
        categoryName: category.categoryName,
        status: "ready",
        imageUrl: photo.url,
        mediumImageUrl: photo.mediumUrl,
        pexelsId: photo.pexelsId,
        photographer: photo.photographer,
        photographerUrl: photo.photographerUrl,
        imageAlt: photo.alt,
        avgColor: photo.avgColor,
        imageWidth: photo.width,
        imageHeight: photo.height,
        // Design params (used by Fabric.js on frontend)
        layout: layout.layout || "bottom_text",
        overlayColor: layout.overlayColor || "#000000",
        textColor: layout.textColor || "#ffffff",
        font: category.font || "Montserrat",
        // Content (will be overridden by AI at publish time)
        title: category.fallbackTitle || "",
        description: category.fallbackDescription || "",
        customDescription: null,   // set if user manually assigns one
        hashtags: category.keywords || [],
        assignedCta: null,         // null = inherit from category
        assignedLink: null,        // null = inherit from category
      });

      pins.push(pin);
    }

    // 4. Update category pin count
    await updateCategory(categoryId, {
      pinCount: (category.pinCount || 0) + pins.length,
    });

    res.status(201).json({
      success: true,
      generated: pins.length,
      pins,
    });
  } catch (err) {
    console.error("Generate pins error:", err);
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: { responseLimit: "10mb" },
};
