import { requireAuth } from "../../../lib/session";
import { generateCategoryMeta, suggestFont } from "../../../lib/huggingface";
import { findOrCreateBoard } from "../../../lib/pinterest";
import { createCategory, getUser } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await requireAuth(req, res);
  if (!session) return;

  const { userInput } = req.body;
  if (!userInput?.trim()) {
    return res.status(400).json({ error: "userInput is required" });
  }

  try {
    // 1. AI generates category meta
    const meta = await generateCategoryMeta(userInput.trim());

    // 2. AI suggests a font
    const fontSuggestion = await suggestFont(meta.categoryName);

    // 3. Get user's Pinterest access token
    const user = await getUser(session.userId);
    if (!user?.accessToken) {
      return res.status(401).json({ error: "Pinterest token missing. Please log in again." });
    }

    // 4. Find or create Pinterest board
    let board = null;
    try {
      board = await findOrCreateBoard(
        user.accessToken,
        meta.boardName,
        meta.boardDescription
      );
    } catch (boardErr) {
      console.error("Board creation error:", boardErr.message);
      // Don't block category creation if board creation fails
    }

    // 5. Save category to Firebase
    const category = await createCategory({
      userId: session.userId,
      userInput: userInput.trim(),
      categoryName: meta.categoryName,
      boardName: meta.boardName,
      boardId: board?.id || null,
      boardDescription: meta.boardDescription,
      fallbackTitle: meta.fallbackTitle,
      fallbackDescription: meta.fallbackDescription,
      keywords: meta.keywords || [],
      font: fontSuggestion.font || "Montserrat",
      fontReason: fontSuggestion.reason || "",
      cta: "link_in_bio",
      destinationLink: "",
      autoGenerate: false,
      autoGenerateThreshold: 10,
      autoGenerateCount: 30,
      pinCount: 0,
    });

    res.status(201).json({ category });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: err.message });
  }
}
