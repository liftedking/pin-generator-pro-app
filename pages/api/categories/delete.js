import { requireAuth } from "../../../lib/session";
import { deleteCategory, getCategory, getCategoryPins, deletePin } from "../../../firebase/db";
import { adminStorage } from "../../../firebase/admin";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { categoryId } = req.body;
  if (!categoryId) return res.status(400).json({ error: "categoryId required" });

  try {
    const category = await getCategory(categoryId);
    if (!category || category.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete all pins in the category
    const pins = await getCategoryPins(categoryId);
    for (const pin of pins) {
      // Delete image from Firebase Storage if stored there
      if (pin.storageRef) {
        try {
          await adminStorage.bucket().file(pin.storageRef).delete();
        } catch (e) {
          console.warn("Could not delete storage file:", e.message);
        }
      }
      await deletePin(pin.id);
    }

    // Delete the category
    await deleteCategory(categoryId);

    res.status(200).json({ success: true, deletedPins: pins.length });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: err.message });
  }
}
