import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useColorTheme } from "./Usecolortheme";

export default function ColorThemePicker() {
  const [open, setOpen] = useState(false);
  const { themeId, setThemeId, themes } = useColorTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 bg-white shadow-md border border-gray-200 rounded-xl p-3 flex flex-col gap-1 w-44">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setThemeId(theme.id);
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: theme.primary }}
              />
              <span className="flex-1 text-left">{theme.label}</span>
              {themeId === theme.id && <Check className="w-3.5 h-3.5 text-gray-400" />}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Changer les couleurs"
        className="flex items-center gap-2 bg-white shadow-md border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Palette className="w-4 h-4" />
        Couleurs
      </button>
    </div>
  );
}
