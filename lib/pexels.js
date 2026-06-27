const PEXELS_BASE = "https://api.pexels.com/v1";

// ── Search photos ──────────────────────────────────────────────────────────

export async function searchPhotos(query, count = 10, page = 1) {
  const params = new URLSearchParams({
    query,
    per_page: Math.min(count, 80).toString(),
    page: page.toString(),
    orientation: "portrait", // Pinterest favors portrait/vertical images
    size: "large",
  });

  const res = await fetch(`${PEXELS_BASE}/search?${params}`, {
    headers: { Authorization: process.env.PEXELS_API_KEY },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pexels search failed: ${err}`);
  }

  const data = await res.json();
  return (data.photos || []).map(normalizePhoto);
}

// ── Curated photos (fallback) ──────────────────────────────────────────────

export async function getCuratedPhotos(count = 10) {
  const res = await fetch(
    `${PEXELS_BASE}/curated?per_page=${Math.min(count, 80)}`,
    { headers: { Authorization: process.env.PEXELS_API_KEY } }
  );
  if (!res.ok) throw new Error("Pexels curated fetch failed");
  const data = await res.json();
  return (data.photos || []).map(normalizePhoto);
}

// ── Fetch multiple pages for large batches ────────────────────────────────

export async function searchPhotosMany(query, count) {
  const perPage = 80;
  const pages = Math.ceil(count / perPage);
  const results = [];

  for (let page = 1; page <= pages; page++) {
    const needed = Math.min(perPage, count - results.length);
    const photos = await searchPhotos(query, needed, page);
    results.push(...photos);
    if (results.length >= count) break;
    // Small delay to be respectful of rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return results.slice(0, count);
}

// ── Normalize photo object ─────────────────────────────────────────────────

function normalizePhoto(photo) {
  return {
    pexelsId: photo.id,
    url: photo.src.large2x || photo.src.large || photo.src.original,
    mediumUrl: photo.src.medium,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    alt: photo.alt || "",
    width: photo.width,
    height: photo.height,
    avgColor: photo.avg_color,
  };
}
