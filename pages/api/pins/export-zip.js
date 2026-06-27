import { requireAuth } from "../../../lib/session";
import { getPin } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { pinIds } = req.body;
  if (!Array.isArray(pinIds) || !pinIds.length) {
    return res.status(400).json({ error: "pinIds array required" });
  }

  try {
    const pins = [];
    for (const pinId of pinIds) {
      const pin = await getPin(pinId);
      if (pin && pin.userId === session.userId) pins.push(pin);
    }

    // Return metadata — actual ZIP is built client-side with JSZip
    // This route validates ownership and returns signed image URLs
    const exportData = pins.map((pin) => ({
      id: pin.id,
      imageUrl: pin.imageUrl,
      title: pin.title || pin.categoryName,
      description: pin.customDescription || pin.description,
      hashtags: pin.hashtags,
      font: pin.font,
      categoryName: pin.categoryName,
    }));

    // Estimate size: average Pinterest image ~300KB
    const estimatedSizeKB = exportData.length * 300;

    res.status(200).json({ pins: exportData, estimatedSizeKB });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
