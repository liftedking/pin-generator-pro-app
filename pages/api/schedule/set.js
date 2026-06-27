import { requireAuth } from "../../../lib/session";
import { setSchedule, getCategorySchedule, getCategory, getAllSchedules } from "../../../firebase/db";

export default async function handler(req, res) {
  if (req.method === "POST") return handleSet(req, res);
  if (req.method === "GET") return handleList(req, res);
  res.status(405).end();
}

// ── Set/update schedule for a category ────────────────────────────────────

async function handleSet(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  const { categoryId, times } = req.body;
  if (!categoryId) return res.status(400).json({ error: "categoryId required" });
  if (!Array.isArray(times)) return res.status(400).json({ error: "times must be an array" });

  try {
    const category = await getCategory(categoryId);
    if (!category || category.userId !== session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Check for time conflicts with other categories
    const allSchedules = await getAllSchedules(session.userId);
    const conflicts = [];

    for (const time of times) {
      for (const schedule of allSchedules) {
        if (schedule.id === categoryId) continue; // skip self
        if (schedule.times?.includes(time)) {
          conflicts.push({
            time,
            conflictingCategory: schedule.categoryName || schedule.id,
          });
        }
      }
    }

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: "Time conflict",
        conflicts,
        message: conflicts
          .map(
            (c) =>
              `${c.time} is already used in "${c.conflictingCategory}". Choose a time at least 1 hour before or after.`
          )
          .join(" | "),
      });
    }

    // Save schedule
    await setSchedule(categoryId, {
      userId: session.userId,
      categoryId,
      categoryName: category.categoryName,
      times: times.sort(), // keep sorted for easy reading
      active: true,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Set schedule error:", err);
    res.status(500).json({ error: err.message });
  }
}

// ── List all schedules for user ────────────────────────────────────────────

async function handleList(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;

  try {
    const schedules = await getAllSchedules(session.userId);
    res.status(200).json({ schedules });
  } catch (err) {
    console.error("List schedules error:", err);
    res.status(500).json({ error: err.message });
  }
}
