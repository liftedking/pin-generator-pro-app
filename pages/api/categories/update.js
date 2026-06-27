import { requireAuth } from "../../../lib/session";
import { updateCategory, getCategory } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { categoryId, ...updates } = req.body;
  if (!categoryId) return res.status(400).json({ error: "categoryId required" });

  try {
    const category = await getCategory(categoryId);
    if (!category || category.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Whitelist updatable fields
    const allowed = [
      "cta", "destinationLink", "font", "autoGenerate",
      "autoGenerateThreshold", "autoGenerateCount",
      "fallbackTitle", "fallbackDescription",
    ];

    const safeUpdates = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    await updateCategory(categoryId, safeUpdates);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: err.message });
  }
}
