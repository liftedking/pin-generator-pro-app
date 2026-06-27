import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";

export default function AssignPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { categoryId } = router.query;

  const [category, setCategory] = useState(null);
  const [pins, setPins] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [preset, setPreset] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (categoryId) loadData();
  }, [categoryId]);

  async function loadData() {
    setFetching(true);
    try {
      const [catRes, pinsRes] = await Promise.all([
        fetch("/api/categories/list"),
        fetch(`/api/pins/list?categoryId=${categoryId}`),
      ]);
      const catData = await catRes.json();
      const pinsData = await pinsRes.json();

      const cat = catData.categories?.find((c) => c.id === categoryId);
      setCategory(cat);

      const allPins = pinsData.pins || [];
      setPins(allPins);
      // Show only pins without a custom description
      setUnassigned(allPins.filter((p) => !p.customDescription));
    } finally {
      setFetching(false);
    }
  }

  function toggleSelect(pinId) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(pinId) ? s.delete(pinId) : s.add(pinId);
      return s;
    });
  }

  function selectAll() {
    setSelected(new Set(unassigned.map((p) => p.id)));
  }

  async function handleAssign() {
    if (!selected.size) return;
    if (!preset.description.trim()) {
      alert("Please enter a description before assigning.");
      return;
    }

    setSaving(true);
    setSuccess("");

    try {
      for (const pinId of selected) {
        await fetch("/api/pins/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pinId,
            title: preset.title || undefined,
            customDescription: preset.description,
            status: "ready",
          }),
        });
      }

      setSuccess(`Assigned description to ${selected.size} pin(s).`);
      setSelected(new Set());
      setPreset({ title: "", description: "" });
      // Refresh unassigned list
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return null;

  const assignedCount = pins.length - unassigned.length;

  return (
    <>
      <Head>
        <title>Assign Descriptions — {category?.categoryName || ""} — Pin Generator Pro</title>
      </Head>
      <Layout>
        <div className="max-w-4xl">
          <button
            onClick={() => router.push(`/pins/${categoryId}`)}
            className="text-gray-500 hover:text-gray-300 text-sm mb-4 block"
          >
            ← Back to Pins
          </button>

          <h1 className="page-title">Assign Descriptions</h1>
          <p className="page-subtitle">
            {category?.categoryName} · {assignedCount}/{pins.length} assigned · {unassigned.length} remaining
          </p>

          {/* Info */}
          <div className="card mb-6 bg-gray-800/40 border-gray-700">
            <p className="text-sm text-gray-400">
              Write a description preset below, select the pins it matches, then click <strong className="text-white">Add</strong>. Those pins disappear from the pool. Repeat until all are assigned. Assigned descriptions override AI-generated ones at publish time.
            </p>
          </div>

          {unassigned.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-white font-semibold mb-1">All pins have descriptions!</p>
              <p className="text-gray-400 text-sm">Every pin in this category has a custom description assigned.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Preset form */}
              <div className="lg:col-span-1">
                <div className="card sticky top-24">
                  <h3 className="section-title">Description Preset</h3>

                  <div className="mb-3">
                    <label className="label">Title (optional)</label>
                    <input
                      className="input"
                      value={preset.title}
                      onChange={(e) => setPreset((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Leave empty to use AI title"
                      maxLength={100}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="label">Description</label>
                    <textarea
                      className="input resize-none"
                      rows={5}
                      value={preset.description}
                      onChange={(e) => setPreset((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Write your description here... AI will still append the CTA and hashtags."
                    />
                  </div>

                  {success && (
                    <div className="mb-3 text-sm text-green-400 bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleAssign}
                    disabled={!selected.size || saving || !preset.description.trim()}
                    className="btn-primary w-full"
                  >
                    {saving
                      ? "Assigning..."
                      : selected.size
                      ? `Add to ${selected.size} pin(s)`
                      : "Select pins first"}
                  </button>

                  {selected.size > 0 && (
                    <button
                      onClick={() => setSelected(new Set())}
                      className="btn-ghost w-full text-sm mt-2"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Unassigned pins grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-400">
                    {unassigned.length} unassigned · {selected.size} selected
                  </p>
                  <button
                    onClick={selectAll}
                    className="text-sm text-brand-400 hover:text-brand-300"
                  >
                    Select all
                  </button>
                </div>

                {fetching ? (
                  <div className="text-gray-500 text-sm">Loading...</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {unassigned.map((pin) => (
                      <button
                        key={pin.id}
                        onClick={() => toggleSelect(pin.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                          selected.has(pin.id)
                            ? "border-brand-500 scale-95"
                            : "border-transparent hover:border-gray-600"
                        }`}
                        style={{ aspectRatio: "2/3" }}
                      >
                        <img
                          src={pin.mediumImageUrl || pin.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {selected.has(pin.id) && (
                          <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                            <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
