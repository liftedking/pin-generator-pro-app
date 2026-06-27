import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";

const FONTS = [
  "Montserrat", "Playfair Display", "Oswald", "Raleway", "Lato",
  "Roboto Slab", "Dancing Script", "Bebas Neue", "Nunito", "Poppins",
  "Merriweather", "Lobster", "Abril Fatface",
];

export default function CategorySettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id: categoryId } = router.query;

  const [category, setCategory] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [applyFontToAll, setApplyFontToAll] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (categoryId) loadCategory();
  }, [categoryId]);

  async function loadCategory() {
    const res = await fetch("/api/categories/list");
    const data = await res.json();
    const cat = data.categories?.find((c) => c.id === categoryId);
    setCategory(cat);
    setForm({
      cta: cat?.cta || "link_in_bio",
      destinationLink: cat?.destinationLink || "",
      font: cat?.font || "Montserrat",
      fallbackTitle: cat?.fallbackTitle || "",
      fallbackDescription: cat?.fallbackDescription || "",
      autoGenerate: cat?.autoGenerate || false,
      autoGenerateThreshold: cat?.autoGenerateThreshold || 10,
      autoGenerateCount: cat?.autoGenerateCount || 30,
    });
  }

  async function handleSave() {
    setSaving(true);
    setSuccess("");
    try {
      await fetch("/api/categories/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, ...form }),
      });

      // Apply font to all pins in category if checkbox checked
      if (applyFontToAll) {
        await fetch("/api/pins/apply-font", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, font: form.font }),
        });
      }

      setSuccess("Settings saved.");
      loadCategory();
    } finally {
      setSaving(false);
    }
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading || !user || !category) return null;

  return (
    <>
      <Head>
        <title>{category.categoryName} Settings — Pin Generator Pro</title>
      </Head>
      <Layout>
        <div className="max-w-lg">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-300 text-sm mb-4 block">
            ← Dashboard
          </button>
          <h1 className="page-title">{category.categoryName}</h1>
          <p className="page-subtitle">Category settings</p>

          {/* Board info */}
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pinterest Board</p>
                <p className="text-white font-medium">{category.boardName}</p>
              </div>
              <span className={`badge ${category.boardId ? "badge-ready" : "bg-yellow-900 text-yellow-300"}`}>
                {category.boardId ? "Connected" : "Not created"}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="card mb-4">
            <h3 className="section-title">Call to Action</h3>
            <label className="label">Default CTA for this category</label>
            <select className="input mb-3" value={form.cta} onChange={(e) => update("cta", e.target.value)}>
              <option value="link_in_bio">Link in bio</option>
              <option value="click_link_below">Click the link below</option>
            </select>

            <label className="label">Destination link</label>
            <input
              type="url"
              className="input"
              value={form.destinationLink}
              onChange={(e) => update("destinationLink", e.target.value)}
              placeholder="https://... (optional unless using 'Click the link below')"
            />
            {form.cta === "click_link_below" && !form.destinationLink && (
              <p className="text-xs text-yellow-400 mt-1">⚠️ A link is required when using "Click the link below"</p>
            )}
          </div>

          {/* Font */}
          <div className="card mb-4">
            <h3 className="section-title">Font</h3>
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => update("font", f)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                    form.font === f ? "border-brand-500 bg-brand-900/20" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <p className="text-white text-sm" style={{ fontFamily: `'${f}', sans-serif` }}>
                    {category.fallbackTitle || "Sample pin title"}
                  </p>
                  <p className="text-gray-500 text-xs">{f}</p>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={applyFontToAll}
                onChange={(e) => setApplyFontToAll(e.target.checked)}
                className="rounded border-gray-600 accent-brand-500"
              />
              <span className="text-sm text-gray-300">Apply this font to all existing pins in this category</span>
            </label>
          </div>

          {/* Fallback content */}
          <div className="card mb-4">
            <h3 className="section-title">Fallback Content</h3>
            <p className="text-xs text-gray-500 mb-3">Used when AI generation fails or as a safety net.</p>

            <label className="label">Fallback title</label>
            <input
              className="input mb-3"
              value={form.fallbackTitle}
              onChange={(e) => update("fallbackTitle", e.target.value)}
              maxLength={100}
            />

            <label className="label">Fallback description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.fallbackDescription}
              onChange={(e) => update("fallbackDescription", e.target.value)}
            />
          </div>

          {/* Auto-generate */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title mb-0">Auto-Generate</h3>
              <button
                onClick={() => update("autoGenerate", !form.autoGenerate)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.autoGenerate ? "bg-brand-600" : "bg-gray-700"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.autoGenerate ? "translate-x-4" : "translate-x-1"}`} />
              </button>
            </div>

            {form.autoGenerate && (
              <div className="space-y-3">
                <div>
                  <label className="label">Generate more when pins remaining drops to</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input w-24"
                      min={1}
                      value={form.autoGenerateThreshold}
                      onChange={(e) => update("autoGenerateThreshold", Number(e.target.value))}
                    />
                    <span className="text-gray-400 text-sm">pins</span>
                  </div>
                </div>
                <div>
                  <label className="label">Number of pins to auto-generate</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input w-24"
                      min={1}
                      max={80}
                      value={form.autoGenerateCount}
                      onChange={(e) => update("autoGenerateCount", Number(e.target.value))}
                    />
                    <span className="text-gray-400 text-sm">pins</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {success && (
            <div className="mb-4 text-sm text-green-400 bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </Layout>
    </>
  );
}
