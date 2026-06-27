import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/Layout";
import PinCard from "../../components/PinCard";
import GenerateModal from "../../components/GenerateModal";
import ZipExportModal from "../../components/ZipExportModal";
import { useAuth } from "../../context/AuthContext";

export default function PinsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { categoryId } = router.query;

  const [pins, setPins] = useState([]);
  const [category, setCategory] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [showGenerate, setShowGenerate] = useState(false);
  const [showZip, setShowZip] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading]);

  useEffect(() => {
    if (categoryId) {
      loadPins();
      loadCategory();
    }
  }, [categoryId]);

  async function loadCategory() {
    const res = await fetch("/api/categories/list");
    const data = await res.json();
    const cat = data.categories?.find((c) => c.id === categoryId);
    setCategory(cat || null);
  }

  async function loadPins() {
    setFetching(true);
    try {
      const res = await fetch(`/api/pins/list?categoryId=${categoryId}`);
      const data = await res.json();
      setPins(data.pins || []);
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete(pinId) {
    await fetch("/api/pins/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId }),
    });
    setPins((prev) => prev.filter((p) => p.id !== pinId));
    setSelected((prev) => { const s = new Set(prev); s.delete(pinId); return s; });
  }

  async function handleDeleteSelected() {
    if (!confirm(`Delete ${selected.size} selected pin(s)?`)) return;
    for (const pinId of selected) {
      await fetch("/api/pins/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId }),
      });
    }
    setPins((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  }

  function toggleSelect(pinId) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(pinId) ? s.delete(pinId) : s.add(pinId);
      return s;
    });
  }

  function selectAll() {
    setSelected(new Set(pins.map((p) => p.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const selectedPins = pins.filter((p) => selected.has(p.id));

  if (loading || !user) return null;

  return (
    <>
      <Head>
        <title>{category?.categoryName || "Pins"} — Pin Generator Pro</title>
      </Head>
      <Layout>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Dashboard
              </button>
            </div>
            <h1 className="page-title">{category?.categoryName || "Pins"}</h1>
            <p className="page-subtitle">{pins.length} pins in pool</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedPins.length > 0 && (
              <>
                <button
                  onClick={() => setShowZip(true)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  📦 Export ZIP ({selectedPins.length})
                </button>
                <button onClick={handleDeleteSelected} className="btn-danger text-sm">
                  Delete ({selected.size})
                </button>
              </>
            )}
            <button
              onClick={() => setShowGenerate(true)}
              className="btn-primary flex items-center gap-2"
            >
              {pins.length === 0 ? "Generate Pins" : "Generate Again"}
            </button>
          </div>
        </div>

        {/* Selection controls */}
        {pins.length > 0 && (
          <div className="flex items-center gap-3 mb-4 text-sm">
            {selected.size < pins.length ? (
              <button onClick={selectAll} className="text-brand-400 hover:text-brand-300">
                Select all ({pins.length})
              </button>
            ) : (
              <button onClick={clearSelection} className="text-gray-400 hover:text-gray-300">
                Clear selection
              </button>
            )}
            {selected.size > 0 && (
              <span className="text-gray-500">{selected.size} selected</span>
            )}
          </div>
        )}

        {/* Pins grid */}
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading pins...</div>
          </div>
        ) : pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🖼️</div>
            <h3 className="text-lg font-semibold text-white mb-2">No pins yet</h3>
            <p className="text-gray-400 mb-6 max-w-sm">
              Generate your first batch of pins for this category.
            </p>
            <button onClick={() => setShowGenerate(true)} className="btn-primary">
              Generate Pins
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pins.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                category={category}
                selected={selected.has(pin.id)}
                onSelect={() => toggleSelect(pin.id)}
                onDelete={() => handleDelete(pin.id)}
                onUpdate={(updated) => {
                  setPins((prev) =>
                    prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                  );
                }}
              />
            ))}
          </div>
        )}
      </Layout>

      {showGenerate && (
        <GenerateModal
          category={category}
          onClose={() => setShowGenerate(false)}
          onGenerated={() => { setShowGenerate(false); loadPins(); loadCategory(); }}
        />
      )}

      {showZip && (
        <ZipExportModal
          pins={selectedPins}
          onClose={() => setShowZip(false)}
        />
      )}
    </>
  );
}
