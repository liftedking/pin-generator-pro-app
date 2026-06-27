import { requireAuth } from "../../../lib/session";
import { deletePin, getPin, updateCategory, getCategory } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { pinId } = req.body;
  if (!pinId) return res.status(400).json({ error: "pinId required" });

  try {
    const pin = await getPin(pinId);
    if (!pin || pin.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await deletePin(pinId);

    // Update category pin count
    const category = await getCategory(pin.categoryId);
    if (category) {
      await updateCategory(pin.categoryId, {
        pinCount: Math.max(0, (category.pinCount || 1) - 1),
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete pin error:", err);
    res.status(500).json({ error: err.message });
  }
}
