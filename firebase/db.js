import { adminDb } from "./admin";

// ── Collection references ──────────────────────────────────────────────────

export const usersCol = () => adminDb.collection("users");
export const categoriesCol = () => adminDb.collection("categories");
export const pinsCol = () => adminDb.collection("pins");
export const scheduleCol = () => adminDb.collection("schedules");
export const logsCol = () => adminDb.collection("logs");

// ── User helpers ───────────────────────────────────────────────────────────

export async function getUser(userId) {
  const doc = await usersCol().doc(userId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function upsertUser(userId, data) {
  await usersCol().doc(userId).set(data, { merge: true });
}

// ── Category helpers ───────────────────────────────────────────────────────

export async function getCategory(categoryId) {
  const doc = await categoriesCol().doc(categoryId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function getUserCategories(userId) {
  const snap = await categoriesCol()
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createCategory(data) {
  const ref = categoriesCol().doc();
  await ref.set({ ...data, createdAt: new Date().toISOString() });
  return { id: ref.id, ...data };
}

export async function updateCategory(categoryId, data) {
  await categoriesCol().doc(categoryId).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCategory(categoryId) {
  await categoriesCol().doc(categoryId).delete();
}

// ── Pin helpers ────────────────────────────────────────────────────────────

export async function getPin(pinId) {
  const doc = await pinsCol().doc(pinId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function getCategoryPins(categoryId, status = null) {
  let query = pinsCol().where("categoryId", "==", categoryId);
  if (status) query = query.where("status", "==", status);
  query = query.orderBy("createdAt", "desc");
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getReadyPinsCount(categoryId) {
  const snap = await pinsCol()
    .where("categoryId", "==", categoryId)
    .where("status", "==", "ready")
    .count()
    .get();
  return snap.data().count;
}

export async function createPin(data) {
  const ref = pinsCol().doc();
  await ref.set({ ...data, createdAt: new Date().toISOString() });
  return { id: ref.id, ...data };
}

export async function updatePin(pinId, data) {
  await pinsCol().doc(pinId).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deletePin(pinId) {
  await pinsCol().doc(pinId).delete();
}

export async function getRandomReadyPin(categoryId) {
  const pins = await getCategoryPins(categoryId, "ready");
  if (!pins.length) return null;
  return pins[Math.floor(Math.random() * pins.length)];
}

// ── Schedule helpers ───────────────────────────────────────────────────────

export async function getCategorySchedule(categoryId) {
  const doc = await scheduleCol().doc(categoryId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function getAllSchedules(userId) {
  let query = scheduleCol();
  // If userId provided, filter to that user only. If null, fetch all (used by cron)
  if (userId) query = query.where("userId", "==", userId);
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setSchedule(categoryId, data) {
  await scheduleCol().doc(categoryId).set(data, { merge: true });
}

// ── Log helpers ────────────────────────────────────────────────────────────

export async function writeLog(data) {
  const ref = logsCol().doc();
  await ref.set({ ...data, timestamp: new Date().toISOString() });
}

export async function getRecentLogs(userId, limit = 50) {
  const snap = await logsCol()
    .where("userId", "==", userId)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
