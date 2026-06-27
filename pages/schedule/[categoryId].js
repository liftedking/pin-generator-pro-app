import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";

export default function SchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { categoryId } = router.query;

  const [category, setCategory] = useState(null);
  const [times, setTimes] = useState([]);
  const [newTime, setNewTime] = useState("08:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (categoryId) loadData();
  }, [categoryId]);

  async function loadData() {
    const [catRes, schedRes] = await Promise.all([
      fetch("/api/categories/list"),
      fetch("/api/schedule/set"),
    ]);
    const catData = await catRes.json();
    const cat = catData.categories?.find((c) => c.id === categoryId);
    setCategory(cat || null);

    const schedData = await schedRes.json();
    const schedule = schedData.schedules?.find((s) => s.id === categoryId);
    setTimes(schedule?.times || []);
  }

  function addTime() {
    if (!newTime) return;
    if (times.includes(newTime)) {
      setError("This time is already added.");
      return;
    }
    setTimes((prev) => [...prev, newTime].sort());
    setError("");
  }

  function removeTime(t) {
    setTimes((prev) => prev.filter((x) => x !== t));
  }

  async function saveSchedule() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/schedule/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, times }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Failed to save");
        return;
      }
      setSuccess("Schedule saved! Pins will publish daily at these times.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Head>
        <title>Schedule — {category?.categoryName || ""} — Pin Generator Pro</title>
      </Head>
      <Layout>
        <div className="max-w-lg">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-300 text-sm mb-4 block"
          >
            ← Dashboard
          </button>

          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">
            {category?.categoryName} · Daily publish times
          </p>

          {/* Info card */}
          <div className="card mb-6 bg-brand-900/20 border-brand-800">
            <p className="text-sm text-brand-300">
              Every day at each time below, one pin from <strong>{category?.categoryName}</strong> will be published to Pinterest automatically. The AI picks the pin and writes the content 5 minutes before publish time.
            </p>
          </div>

          {/* Add time */}
          <div className="card mb-4">
            <label className="label">Add publish time</label>
            <div className="flex gap-2">
              <input
                type="time"
                className="input"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <button onClick={addTime} className="btn-primary whitespace-nowrap">
                Add Time
              </button>
            </div>
          </div>

          {/* Time list */}
          {times.length > 0 ? (
            <div className="card mb-4">
              <h3 className="section-title">Scheduled times ({times.length}/day)</h3>
              <div className="space-y-2">
                {times.map((t) => {
                  // Convert to 12h display
                  const [h, m] = t.split(":").map(Number);
                  const period = h >= 12 ? "PM" : "AM";
                  const hour12 = h % 12 || 12;
                  const display = `${hour12}:${String(m).padStart(2, "0")} ${period}`;

                  return (
                    <div key={t} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <span className="text-white font-semibold">{display}</span>
                        <span className="text-gray-500 text-xs ml-2">(1 pin published)</span>
                      </div>
                      <button
                        onClick={() => removeTime(t)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Total: <span className="text-white">{times.length} pin{times.length !== 1 ? "s" : ""}/day</span> from this category
              </p>
            </div>
          ) : (
            <div className="card mb-4 text-center py-8">
              <p className="text-gray-500 text-sm">No times set yet. Add your first publish time above.</p>
            </div>
          )}

          {/* Errors / success */}
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-sm text-green-400 bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button
            onClick={saveSchedule}
            disabled={saving || times.length === 0}
            className="btn-primary w-full"
          >
            {saving ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      </Layout>
    </>
  );
}
