import { getAllSchedules, getReadyPinsCount } from "../../../firebase/db";

// This endpoint is called by the Railway cron service every minute.
// It checks all schedules and returns which categories need to publish soon.
// The Railway service then calls /api/publish/execute for each due category.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const cronSecret = req.headers["x-cron-secret"];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // We look for scheduled times that are exactly 5 minutes away
    const targetHour = currentMinute >= 55
      ? (currentHour + 1) % 24
      : currentHour;
    const targetMinute = (currentMinute + 5) % 60;

    // Format as HH:MM to match stored times
    const targetTime = `${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}`;

    // Get all active schedules
    const allSchedules = await getAllSchedules(null); // null = all users

    const due = [];
    for (const schedule of allSchedules) {
      if (!schedule.active) continue;
      if (!schedule.times?.includes(targetTime)) continue;

      // Check if there are pins available
      const pinCount = await getReadyPinsCount(schedule.categoryId);
      if (pinCount === 0) {
        due.push({
          categoryId: schedule.categoryId,
          userId: schedule.userId,
          time: targetTime,
          skipped: true,
          reason: "No ready pins",
        });
        continue;
      }

      due.push({
        categoryId: schedule.categoryId,
        userId: schedule.userId,
        time: targetTime,
        skipped: false,
      });
    }

    res.status(200).json({ targetTime, due });
  } catch (err) {
    console.error("Cron trigger error:", err);
    res.status(500).json({ error: err.message });
  }
}
