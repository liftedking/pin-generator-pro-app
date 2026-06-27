import { getPinterestAuthUrl } from "../../../lib/pinterest";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const url = getPinterestAuthUrl();
  res.redirect(url);
}
