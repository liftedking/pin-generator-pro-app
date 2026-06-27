import { exchangeCodeForToken, getPinterestUser } from "../../../../lib/pinterest";
import { createSession, setSessionCookie } from "../../../../lib/session";
import { upsertUser, writeLog } from "../../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect("/?error=pinterest_denied");
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch Pinterest user profile
    const pinterestUser = await getPinterestUser(access_token);

    const userId = pinterestUser.id || pinterestUser.username;
    const expiresAt = Date.now() + (expires_in || 3600) * 1000;

    // Save/update user in Firebase
    await upsertUser(userId, {
      pinterestId: userId,
      username: pinterestUser.username,
      displayName: `${pinterestUser.first_name || ""} ${pinterestUser.last_name || ""}`.trim(),
      profileImage: pinterestUser.profile_image,
      accessToken: access_token,
      refreshToken: refresh_token || null,
      tokenExpiresAt: expiresAt,
      lastLogin: new Date().toISOString(),
    });

    // Log this login attempt to Firebase for your audit trail
    await writeLog({
      type: "login",
      userId,
      username: pinterestUser.username,
      displayName: `${pinterestUser.first_name || ""} ${pinterestUser.last_name || ""}`.trim(),
      profileImage: pinterestUser.profile_image,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // Create session JWT
    const sessionToken = await createSession({
      userId,
      username: pinterestUser.username,
      displayName: `${pinterestUser.first_name || ""} ${pinterestUser.last_name || ""}`.trim(),
      profileImage: pinterestUser.profile_image,
    });

    setSessionCookie(res, sessionToken);
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Pinterest callback error:", err);
    res.redirect("/?error=auth_failed");
  }
}
