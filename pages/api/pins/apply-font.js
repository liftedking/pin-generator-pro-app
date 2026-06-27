import { requireAuth } from "../../../lib/session";
import { getCategoryPins, getCategory } from "../../../firebase/db";
import { adminDb } from "../../../firebase/admin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { categoryId, font } = req.body;
  if (!categoryId || !font) return res.status(400).json({ error: "categoryId and font required" });

  try {
    const category = await getCategory(categoryId);
    if (!category || category.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const pins = await getCategoryPins(categoryId);

    // Batch update all pins
    const batch = adminDb.batch();
    for (const pin of pins) {
      const ref = adminDb.collection("pins").doc(pin.id);
      batch.update(ref, { font, updatedAt: new Date().toISOString() });
    }
    await batch.commit();

    res.status(200).json({ success: true, updated: pins.length });
  } catch (err) {
    console.error("Apply font error:", err);
    res.status(500).json({ error: err.message });
  }
}
