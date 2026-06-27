import { serialize, parse } from "cookie";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-this"
);

const COOKIE_NAME = "pgp_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

// ── Create signed JWT session ──────────────────────────────────────────────

export async function createSession(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
  return token;
}

// ── Verify session token ───────────────────────────────────────────────────

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ── Get session from request cookies ──────────────────────────────────────

export async function getSession(req) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

// ── Set session cookie on response ────────────────────────────────────────

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, token, COOKIE_OPTIONS));
}

// ── Clear session cookie ───────────────────────────────────────────────────

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 })
  );
}

// ── Middleware: require auth or redirect ───────────────────────────────────

export async function requireAuth(req, res) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}
