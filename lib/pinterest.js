const BASE_URL = "https://api.pinterest.com/v5";

// ── OAuth ──────────────────────────────────────────────────────────────────

export function getPinterestAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_APP_ID,
    redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    response_type: "code",
    scope: "boards:read,boards:write,pins:read,pins:write,user_accounts:read",
  });
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const credentials = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh Pinterest token");
  return res.json();
}

// ── User ───────────────────────────────────────────────────────────────────

export async function getPinterestUser(accessToken) {
  const res = await fetch(`${BASE_URL}/user_account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Pinterest user");
  return res.json();
}

// ── Boards ─────────────────────────────────────────────────────────────────

export async function getUserBoards(accessToken) {
  const res = await fetch(`${BASE_URL}/boards?page_size=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch boards");
  const data = await res.json();
  return data.items || [];
}

export async function createBoard(accessToken, name, description = "") {
  const res = await fetch(`${BASE_URL}/boards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, privacy: "PUBLIC" }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create board: ${err}`);
  }
  return res.json();
}

export async function findOrCreateBoard(accessToken, boardName, description) {
  const boards = await getUserBoards(accessToken);
  const existing = boards.find(
    (b) => b.name.toLowerCase() === boardName.toLowerCase()
  );
  if (existing) return existing;
  return createBoard(accessToken, boardName, description);
}

// ── Pins ───────────────────────────────────────────────────────────────────

export async function publishPin(accessToken, { boardId, title, description, imageUrl, link, altText }) {
  const body = {
    board_id: boardId,
    title,
    description,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
  };

  if (link) body.link = link;
  if (altText) body.alt_text = altText;

  const res = await fetch(`${BASE_URL}/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to publish pin: ${err}`);
  }

  return res.json();
}
