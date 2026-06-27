import Link from "next/link";
import { useState } from "react";

export default function CategoryCard({ category, onDelete, onRefresh }) {
  const [updating, setUpdating] = useState(false);

  async function toggleAutoGenerate() {
    setUpdating(true);
    await fetch("/api/categories/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: category.id,
        autoGenerate: !category.autoGenerate,
      }),
    });
    onRefresh();
    setUpdating(false);
  }

  return (
    <div className="card hover:border-gray-700 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{category.categoryName}</h3>
          <p className="text-xs text-gray-500 truncate mt-0.5">{category.boardName}</p>
        </div>
        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">{category.pinCount || 0} pins</span>
        </div>
        {category.cta && (
          <span className="badge bg-gray-800 text-gray-400 text-xs">
            {category.cta === "link_in_bio" ? "Link in bio" : "Click link below"}
          </span>
        )}
      </div>

      {/* Font preview */}
      <div className="bg-gray-800/50 rounded-lg px-3 py-2 mb-4">
        <p
          className="text-sm text-gray-300 truncate"
          style={{ fontFamily: `'${category.font}', sans-serif` }}
        >
          {category.fallbackTitle || "Sample pin title"}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{category.font}</p>
      </div>

      {/* Auto-generate toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">Auto-generate</span>
        <button
          onClick={toggleAutoGenerate}
          disabled={updating}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            category.autoGenerate ? "bg-brand-600" : "bg-gray-700"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              category.autoGenerate ? "translate-x-4" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Action links */}
      <div className="grid grid-cols-4 gap-2">
        <Link
          href={`/pins/${category.id}`}
          className="text-center text-xs py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          Pins
        </Link>
        <Link
          href={`/schedule/${category.id}`}
          className="text-center text-xs py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          Schedule
        </Link>
        <Link
          href={`/assign/${category.id}`}
          className="text-center text-xs py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          Assign
        </Link>
        <Link
          href={`/category/${category.id}`}
          className="text-center text-xs py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
