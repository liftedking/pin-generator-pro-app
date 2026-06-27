import { requireAuth } from "../../../lib/session";
import { updatePin, getPin } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { pinId, ...updates } = req.body;
  if (!pinId) return res.status(400).json({ error: "pinId required" });

  try {
    const pin = await getPin(pinId);
    if (!pin || pin.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allowed = [
      "title", "description", "customDescription",
      "font", "layout", "overlayColor", "textColor",
      "imageUrl", "mediumImageUrl", "categoryId",
      "assignedCta", "assignedLink", "hashtags", "status",
    ];

    const safeUpdates = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    await updatePin(pinId, safeUpdates);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update pin error:", err);
    res.status(500).json({ error: err.message });
  }
}
