import { requireAuth } from "../../../lib/session";
import { getUserCategories } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const categories = await getUserCategories(session.userId);
    res.status(200).json({ categories });
  } catch (err) {
    console.error("List categories error:", err);
    res.status(500).json({ error: err.message });
  }
}
