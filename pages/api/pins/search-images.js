import { requireAuth } from "../../../lib/session";
import { searchPhotos } from "../../../lib/pexels";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "q required" });

  try {
    const photos = await searchPhotos(q, 9);
    res.status(200).json({ photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
