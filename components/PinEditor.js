import { useState } from "react";
import FontPicker from "./FontPicker";

export default function PinEditor({ pin, category, onClose, onSave }) {
  const [title, setTitle] = useState(pin.title || "");
  const [description, setDescription] = useState(pin.customDescription || pin.description || "");
  const [font, setFont] = useState(pin.font || category?.font || "Montserrat");
  const [cta, setCta] = useState(pin.assignedCta || category?.cta || "link_in_bio");
  const [link, setLink] = useState(pin.assignedLink ?? category?.destinationLink ?? "");
  const [imageUrl, setImageUrl] = useState(pin.imageUrl);
  const [newImageSearch, setNewImageSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("content"); // content | image | font

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/pins/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinId: pin.id,
          title,
          customDescription: description,
          font,
          assignedCta: cta,
          assignedLink: link || null,
          imageUrl,
          mediumImageUrl: imageUrl,
        }),
      });
      onSave({ ...pin, title, customDescription: description, font, assignedCta: cta, assignedLink: link, imageUrl });
    } finally {
      setSaving(false);
    }
  }

  async function searchNewImages() {
    if (!newImageSearch.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/pins/search-images?q=${encodeURIComponent(newImageSearch)}`);
      const data = await res.json();
      setSearchResults(data.photos || []);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Edit Pin</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-5">
          {["content", "image", "font"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Preview */}
          <div className="flex gap-4 mb-5">
            <div className="w-24 flex-shrink-0 rounded-lg overflow-hidden" style={{ aspectRatio: "2/3" }}>
              <img src={imageUrl} alt="Pin preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p
                className="text-white font-semibold text-sm leading-snug"
                style={{ fontFamily: `'${font}', sans-serif` }}
              >
                {title || "Pin title preview"}
              </p>
              <p className="text-gray-400 text-xs mt-1 line-clamp-3">
                {description || "Description preview..."}
              </p>
              <p className="text-xs text-gray-600 mt-1">{font}</p>
            </div>
          </div>

          {tab === "content" && (
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Pin title (AI generates at publish time if empty)"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="label">Custom description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Leave empty to let AI generate a unique description at publish time"
                />
                <p className="text-xs text-gray-600 mt-1">
                  If set, this overrides AI-generated descriptions for this pin.
                </p>
              </div>

              <div>
                <label className="label">Call to action (this pin only)</label>
                <select
                  className="input"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                >
                  <option value="link_in_bio">Link in bio</option>
                  <option value="click_link_below">Click the link below</option>
                </select>
              </div>

              <div>
                <label className="label">Destination link (this pin only)</label>
                <input
                  className="input"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {tab === "image" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="input"
                  value={newImageSearch}
                  onChange={(e) => setNewImageSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchNewImages()}
                  placeholder="Search Pexels for a new image..."
                />
                <button
                  onClick={searchNewImages}
                  disabled={searching}
                  className="btn-secondary whitespace-nowrap"
                >
                  {searching ? "..." : "Search"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {searchResults.map((photo) => (
                    <button
                      key={photo.pexelsId}
                      onClick={() => setImageUrl(photo.url)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrl === photo.url ? "border-brand-500" : "border-transparent"
                      }`}
                      style={{ aspectRatio: "2/3" }}
                    >
                      <img src={photo.mediumUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "font" && (
            <FontPicker
              value={font}
              onChange={setFont}
              previewText={title || "Sample pin title"}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-800">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
