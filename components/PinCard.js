import { useState } from "react";
import PinEditor from "./PinEditor";

export default function PinCard({ pin, category, selected, onSelect, onDelete, onUpdate }) {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <div
        className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
          selected ? "border-brand-500" : "border-transparent"
        }`}
        style={{ aspectRatio: "2/3" }}
      >
        {/* Image */}
        <img
          src={pin.mediumImageUrl || pin.imageUrl}
          alt={pin.imageAlt || "Pin"}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200">
          {/* Select checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              selected
                ? "bg-brand-500 border-brand-500"
                : "border-white/70 bg-black/30 opacity-0 group-hover:opacity-100"
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Action buttons */}
          <div className="absolute bottom-0 inset-x-0 p-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}
              className="flex-1 text-xs py-1.5 bg-white/90 hover:bg-white text-gray-900 font-medium rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-2.5 py-1.5 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Font badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">
            {pin.font || category?.font || "Montserrat"}
          </span>
        </div>
      </div>

      {showEditor && (
        <PinEditor
          pin={pin}
          category={category}
          onClose={() => setShowEditor(false)}
          onSave={(updated) => { onUpdate(updated); setShowEditor(false); }}
        />
      )}
    </>
  );
}
