import { requireAuth } from "../../../lib/session";
import { getCategoryPins, getCategory } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { categoryId, status } = req.query;
  if (!categoryId) return res.status(400).json({ error: "categoryId required" });

  try {
    const category = await getCategory(categoryId);
    if (!category || category.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const pins = await getCategoryPins(categoryId, status || null);
    res.status(200).json({ pins });
  } catch (err) {
    console.error("List pins error:", err);
    res.status(500).json({ error: err.message });
  }
}
