import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { useColorTheme } from "./Usecolortheme";

export default function ColorThemePicker() {
  const [open, setOpen] = useState(false);
  const { colors, setBackground, setTextStrong, setPrimary, reset } = useColorTheme();

  return (
    <div className="floating-picker-wrap">
      {open && (
        <div className="color-picker-panel">
          <div className="color-picker-row">
            <label htmlFor="color-bg" className="color-picker-label">Fond</label>
            <input
              id="color-bg"
              type="color"
              value={colors.background}
              onChange={(e) => setBackground(e.target.value)}
              className="color-picker-input"
            />
          </div>

          <div className="color-picker-row">
            <label htmlFor="color-text" className="color-picker-label">Texte / logo</label>
            <input
              id="color-text"
              type="color"
              value={colors.textStrong}
              onChange={(e) => setTextStrong(e.target.value)}
              className="color-picker-input"
            />
          </div>

          <div className="color-picker-row">
            <label htmlFor="color-primary" className="color-picker-label">Boutons</label>
            <input
              id="color-primary"
              type="color"
              value={colors.primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="color-picker-input"
            />
          </div>

          <button onClick={reset} className="color-picker-reset">
            <RotateCcw className="w-3 h-3" />
            Réinitialiser
          </button>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} title="Personnaliser les couleurs" className="floating-toggle-btn">
        <Palette className="w-4 h-4" />
        Couleurs
      </button>
    </div>
  );
}
