import { useState } from "react";

export default function GenerateModal({ category, onClose, onGenerated }) {
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setProgress("Expanding keywords with AI...");

    try {
      setProgress("Fetching images from Pexels...");
      const res = await fetch("/api/pins/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: category.id, count }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setProgress(`Generated ${data.generated} pins!`);
      setTimeout(onGenerated, 800);
    } catch (e) {
      setError(e.message);
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        {loading ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300 text-sm">{progress}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Generate Pins</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-2">
              <p className="text-sm text-gray-400 mb-4">
                Generating pins for <span className="text-white font-medium">{category?.categoryName}</span> using saved keywords.
              </p>

              <label className="label">Number of pins to generate</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="flex-1 accent-brand-500"
                />
                <span className="text-white font-semibold w-8 text-right">{count}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Max 80 per batch (Pexels limit)</p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleGenerate} className="btn-primary flex-1">
                Generate {count} Pins
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
