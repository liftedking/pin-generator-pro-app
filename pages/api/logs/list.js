import { requireAuth } from "../../../lib/session";
import { getRecentLogs } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const logs = await getRecentLogs(session.userId, 100);
    res.status(200).json({ logs });
  } catch (err) {
    console.error("List logs error:", err);
    res.status(500).json({ error: err.message });
  }
}
