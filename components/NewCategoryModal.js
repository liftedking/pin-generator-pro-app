import { useState } from "react";

export default function NewCategoryModal({ onClose, onCreated }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("input"); // input | generating

  async function handleCreate() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setStep("generating");

    try {
      const res = await fetch("/api/categories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      onCreated(data.category);
    } catch (e) {
      setError(e.message);
      setStep("input");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        {step === "generating" ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Setting everything up...</h3>
            <p className="text-gray-400 text-sm">
              AI is naming your category, generating fallback content, suggesting a font, and creating your Pinterest board.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">New Category</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <label className="label">Describe your pin idea</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="e.g. sharp kitchen knives for home cooks, minimalist bedroom decor ideas, bikes for young kids aged 3 to 8..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreate();
                }}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Be descriptive — the AI uses this to name the category, find images, and write content.
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!input.trim() || loading}
                className="btn-primary flex-1"
              >
                Create Category
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
