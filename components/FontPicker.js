const FONTS = [
  "Montserrat",
  "Playfair Display",
  "Oswald",
  "Raleway",
  "Lato",
  "Roboto Slab",
  "Dancing Script",
  "Bebas Neue",
  "Nunito",
  "Poppins",
  "Merriweather",
  "Lobster",
  "Abril Fatface",
];

export { FONTS };

export default function FontPicker({ value, onChange, previewText = "Sample pin title" }) {
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {FONTS.map((font) => (
        <button
          key={font}
          onClick={() => onChange(font)}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
            value === font
              ? "border-brand-500 bg-brand-900/20"
              : "border-gray-800 hover:border-gray-700 bg-transparent"
          }`}
        >
          <p
            className="text-white text-base leading-snug"
            style={{ fontFamily: `'${font}', sans-serif` }}
          >
            {previewText}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">{font}</p>
        </button>
      ))}
    </div>
  );
}
