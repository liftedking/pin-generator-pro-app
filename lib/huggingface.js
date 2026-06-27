const HF_BASE = "https://api-inference.huggingface.co/models";
const HF_KEY = () => `Bearer ${process.env.HUGGINGFACE_API_KEY}`;

// ── Models used ────────────────────────────────────────────────────────────
// Text generation : mistralai/Mistral-7B-Instruct-v0.2
// Image captioning: Salesforce/blip-image-captioning-large
// ──────────────────────────────────────────────────────────────────────────

const TEXT_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const VISION_MODEL = "Salesforce/blip-image-captioning-large";

// ── Generic HF query with retry on 503 (model loading) ────────────────────

async function hfQuery(model, payload, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(`${HF_BASE}/${model}`, {
      method: "POST",
      headers: {
        Authorization: HF_KEY(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 503) {
      // Model is loading — wait and retry
      await new Promise((r) => setTimeout(r, 8000));
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HF error (${model}): ${err}`);
    }

    return res.json();
  }
  throw new Error(`HF model ${model} failed after ${retries} retries`);
}

// ── Expand user keywords for better Pexels results ────────────────────────

export async function expandKeywords(userInput) {
  const prompt = `<s>[INST] You are a Pinterest image search expert. 
The user wants to create Pinterest pins about: "${userInput}"
Generate 5 rich, specific search phrases for finding beautiful, viral-worthy photos on Pexels.
Return ONLY a JSON array of strings, no explanation.
Example: ["cozy minimalist bedroom fairy lights", "warm neutral bedroom decor"]
[/INST]`;

  try {
    const result = await hfQuery(TEXT_MODEL, {
      inputs: prompt,
      parameters: { max_new_tokens: 200, temperature: 0.7, return_full_text: false },
    });

    const text = result[0]?.generated_text || "";
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("expandKeywords error:", e.message);
  }

  // Fallback: use original input split into phrases
  return [userInput, `${userInput} aesthetic`, `${userInput} ideas`];
}

// ── Generate category name, board name, fallback title & description ───────

export async function generateCategoryMeta(userInput) {
  const prompt = `<s>[INST] You are a Pinterest content strategist.
The user wants to create Pinterest pins about: "${userInput}"

Generate the following as a JSON object:
- categoryName: short, clean category label (2-4 words)
- boardName: Pinterest board name (2-5 words, catchy)
- boardDescription: Pinterest board description (1-2 sentences)
- fallbackTitle: a general pin title that works for most pins in this category (max 10 words)
- fallbackDescription: a general pin description with relevant hashtags, ending with "Link in bio." (3-4 sentences)
- keywords: array of 8-10 Pinterest SEO keywords

Return ONLY the JSON object, no explanation.
[/INST]`;

  try {
    const result = await hfQuery(TEXT_MODEL, {
      inputs: prompt,
      parameters: { max_new_tokens: 500, temperature: 0.6, return_full_text: false },
    });

    const text = result[0]?.generated_text || "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("generateCategoryMeta error:", e.message);
  }

  // Fallback defaults
  return {
    categoryName: userInput,
    boardName: userInput,
    boardDescription: `Curated ${userInput} content.`,
    fallbackTitle: `Best ${userInput} Ideas`,
    fallbackDescription: `Discover amazing ${userInput} ideas and inspiration. Save this pin for later! #${userInput.replace(/\s+/g, "")} Link in bio.`,
    keywords: [userInput],
  };
}

// ── Describe an image (vision) ─────────────────────────────────────────────

export async function describeImage(imageUrl) {
  try {
    // Fetch image as buffer
    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    const result = await hfQuery(VISION_MODEL, {
      inputs: { image: `data:${mimeType};base64,${base64}` },
    });

    return result[0]?.generated_text || "";
  } catch (e) {
    console.error("describeImage error:", e.message);
    return "";
  }
}

// ── Generate unique pin title + description ────────────────────────────────

export async function generatePinContent({
  imageDescription,
  categoryName,
  keywords,
  cta,
  fallbackTitle,
  fallbackDescription,
}) {
  const ctaText =
    cta === "click_link_below" ? "Click the link below." : "Link in bio.";

  const prompt = `<s>[INST] You are a Pinterest content creator specializing in viral pins.
Category: ${categoryName}
Image content: ${imageDescription}
Keywords to include: ${keywords?.join(", ")}

Write a Pinterest pin title and description that will go viral.
Return ONLY a JSON object with:
- title: compelling pin title (max 100 characters)
- description: engaging description with hashtags, ending with "${ctaText}" (150-300 characters)
- hashtags: array of 5 relevant hashtags (without #)

[/INST]`;

  try {
    const result = await hfQuery(TEXT_MODEL, {
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.8, return_full_text: false },
    });

    const text = result[0]?.generated_text || "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      // Ensure CTA is always at the end
      if (!parsed.description.includes(ctaText)) {
        parsed.description = parsed.description.trimEnd() + ` ${ctaText}`;
      }
      return parsed;
    }
  } catch (e) {
    console.error("generatePinContent error:", e.message);
  }

  // Fallback to category defaults
  return {
    title: fallbackTitle,
    description: fallbackDescription,
    hashtags: keywords?.slice(0, 5) || [],
  };
}

// ── Suggest a font pairing for a category/mood ────────────────────────────

export async function suggestFont(categoryName, mood = "") {
  const prompt = `<s>[INST] You are a typography expert for Pinterest pin design.
For a Pinterest board about "${categoryName}" with a ${mood || "general"} mood,
suggest the single best Google Font for pin title overlays.
Return ONLY a JSON object: { "font": "Font Name", "reason": "one sentence why" }
Choose from popular Google Fonts like: Playfair Display, Montserrat, Oswald, Raleway, 
Lato, Roboto Slab, Dancing Script, Bebas Neue, Nunito, Poppins, Merriweather, 
Open Sans, Lobster, Abril Fatface, Source Sans Pro
[/INST]`;

  try {
    const result = await hfQuery(TEXT_MODEL, {
      inputs: prompt,
      parameters: { max_new_tokens: 150, temperature: 0.5, return_full_text: false },
    });
    const text = result[0]?.generated_text || "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("suggestFont error:", e.message);
  }

  return { font: "Montserrat", reason: "Clean, versatile, works for any category." };
}

// ── Suggest pin layout style ───────────────────────────────────────────────

export async function suggestLayout(imageDescription, categoryName) {
  const prompt = `<s>[INST] You are a Pinterest pin designer.
Image content: "${imageDescription}"
Category: "${categoryName}"

Choose the best layout for this pin from these options:
1. top_text - large title at top with semi-transparent overlay
2. bottom_text - title and description at bottom with gradient
3. center_overlay - centered text on dark overlay
4. split_panel - colored panel on left/right with text, image on opposite side
5. bold_title_only - very large bold title only, minimal text

Return ONLY JSON: { "layout": "layout_name", "overlayColor": "#hexcolor", "textColor": "#hexcolor" }
Pick overlay and text colors that complement the image's average color.
[/INST]`;

  try {
    const result = await hfQuery(TEXT_MODEL, {
      inputs: prompt,
      parameters: { max_new_tokens: 150, temperature: 0.5, return_full_text: false },
    });
    const text = result[0]?.generated_text || "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("suggestLayout error:", e.message);
  }

  return { layout: "bottom_text", overlayColor: "#000000", textColor: "#ffffff" };
}
