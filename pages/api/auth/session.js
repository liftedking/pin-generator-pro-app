import { getSession, clearSessionCookie } from "../../../lib/session";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ authenticated: false });
    return res.status(200).json({ authenticated: true, user: session });
  }

  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
