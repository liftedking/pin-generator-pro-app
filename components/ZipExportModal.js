import { useState } from "react";

export default function ZipExportModal({ pins, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | estimating | downloading | done | error
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleEstimate() {
    setStatus("estimating");
    try {
      const res = await fetch("/api/pins/export-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinIds: pins.map((p) => p.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEstimatedSize(data.estimatedSizeKB);
      setStatus("ready");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  async function handleDownload() {
    setStatus("downloading");
    setProgress(0);
    setError("");

    try {
      // Dynamically import JSZip (client-side only)
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");

      const zip = new JSZip();
      const folder = zip.folder("pin-generator-pro-export");

      // Create a metadata text file
      let metadata = "Pin Generator Pro Export\n";
      metadata += `Exported: ${new Date().toLocaleString()}\n`;
      metadata += `Total pins: ${pins.length}\n\n`;
      metadata += "─".repeat(40) + "\n\n";

      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        setProgress(Math.round((i / pins.length) * 100));

        try {
          // Fetch image as blob
          const imgRes = await fetch(pin.imageUrl);
          const blob = await imgRes.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          const filename = `pin_${String(i + 1).padStart(3, "0")}_${pin.id.slice(0, 8)}`;

          // Add image to zip
          folder.file(`${filename}.${ext}`, blob);

          // Add to metadata
          metadata += `Pin ${i + 1}: ${filename}\n`;
          metadata += `Category: ${pin.categoryName || ""}\n`;
          metadata += `Title: ${pin.title || "(AI generated at publish)"}\n`;
          metadata += `Description: ${pin.description || pin.customDescription || "(AI generated at publish)"}\n`;
          if (pin.hashtags?.length) {
            metadata += `Hashtags: ${pin.hashtags.map((h) => `#${h}`).join(" ")}\n`;
          }
          metadata += `Font: ${pin.font || "Montserrat"}\n`;
          metadata += `Image URL: ${pin.imageUrl}\n`;
          metadata += "\n";
        } catch (imgErr) {
          console.warn(`Skipped pin ${pin.id}:`, imgErr.message);
          metadata += `Pin ${i + 1}: SKIPPED (${imgErr.message})\n\n`;
        }
      }

      folder.file("metadata.txt", metadata);

      setProgress(100);

      // Generate and download zip
      const content = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        (meta) => setProgress(Math.round(meta.percent))
      );

      saveAs(content, `pin-generator-pro-${Date.now()}.zip`);
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }

  function formatSize(kb) {
    if (kb >= 1024) return `~${(kb / 1024).toFixed(1)} MB`;
    return `~${kb} KB`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Export to ZIP</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pin count */}
        <div className="card mb-4 text-center">
          <p className="text-3xl font-bold text-white">{pins.length}</p>
          <p className="text-gray-400 text-sm">pin{pins.length !== 1 ? "s" : ""} selected for export</p>
        </div>

        {/* Status content */}
        {status === "idle" && (
          <>
            <p className="text-sm text-gray-400 mb-5">
              Images and metadata will be bundled into a ZIP file. Estimate the file size first, or download directly.
            </p>
            <div className="flex gap-3">
              <button onClick={handleEstimate} className="btn-secondary flex-1 text-sm">
                Estimate size
              </button>
              <button onClick={handleDownload} className="btn-primary flex-1 text-sm">
                Download ZIP
              </button>
            </div>
          </>
        )}

        {status === "estimating" && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Calculating...</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="card mb-4 text-center bg-gray-800/50">
              <p className="text-sm text-gray-400 mb-1">Estimated file size</p>
              <p className="text-2xl font-bold text-white">{formatSize(estimatedSize)}</p>
              <p className="text-xs text-gray-600 mt-1">Actual size may vary after compression</p>
            </div>
            <button onClick={handleDownload} className="btn-primary w-full">
              Download ZIP
            </button>
          </>
        )}

        {status === "downloading" && (
          <div className="text-center py-2">
            <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm">
              {progress < 100 ? `Downloading images... ${progress}%` : "Compressing ZIP..."}
            </p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center py-2">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-semibold mb-1">ZIP downloaded!</p>
            <p className="text-gray-400 text-sm mb-4">Check your downloads folder.</p>
            <button onClick={onClose} className="btn-secondary w-full">Close</button>
          </div>
        )}

        {status === "error" && (
          <>
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDownload} className="btn-primary flex-1">Retry</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
