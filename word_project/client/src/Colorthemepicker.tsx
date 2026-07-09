import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { useColorTheme } from "./Usecolortheme";

export default function ColorThemePicker() {
  const [open, setOpen] = useState(false);
  const { colors, setBackground, setTextStrong, setPrimary, reset } = useColorTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 bg-white shadow-md border border-gray-200 rounded-xl p-4 w-56 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="color-bg" className="text-sm text-gray-700">Fond</label>
            <input
              id="color-bg"
              type="color"
              value={colors.background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="color-text" className="text-sm text-gray-700">Texte / logo</label>
            <input
              id="color-text"
              type="color"
              value={colors.textStrong}
              onChange={(e) => setTextStrong(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="color-primary" className="text-sm text-gray-700">Boutons</label>
            <input
              id="color-primary"
              type="color"
              value={colors.primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>

          <button
            onClick={reset}
            className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1 border-t border-gray-100"
          >
            <RotateCcw className="w-3 h-3" />
            Réinitialiser
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Personnaliser les couleurs"
        className="flex items-center gap-2 bg-white shadow-md border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Palette className="w-4 h-4" />
        Couleurs
      </button>
    </div>
  );
}
