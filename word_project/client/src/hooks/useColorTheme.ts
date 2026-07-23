import { useEffect, useState } from "react";

const STORAGE_KEY = "app-color-theme-v2";

export interface CustomColors {
  background: string;
  textStrong: string;
  primary: string;
}

export const DEFAULT_COLORS: CustomColors = {
  background: "#eff6ff",
  textStrong: "#1e3a8a",
  primary: "#2563eb",
};

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

// amount 0..1 : mélange vers blanc (positif) pour éclaircir
function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

// amount 0..1 : mélange vers noir pour assombrir
function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// Retourne blanc ou noir selon la luminosité de la couleur, pour un contraste lisible
function getContrastText(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1f2937" : "#ffffff";
}

function applyColors(colors: CustomColors) {
  const root = document.documentElement.style;
  root.setProperty("--color-bg", colors.background);
  root.setProperty("--color-text-strong", colors.textStrong);
  root.setProperty("--color-primary", colors.primary);
  root.setProperty("--color-primary-hover", darken(colors.primary, 0.15));
  root.setProperty("--color-primary-light", lighten(colors.primary, 0.85));
  root.setProperty("--color-primary-border", lighten(colors.primary, 0.55));
  root.setProperty("--color-on-primary", getContrastText(colors.primary));
}

export function useColorTheme() {
  const [colors, setColors] = useState<CustomColors>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  useEffect(() => {
    applyColors(colors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  }, [colors]);

  const setBackground = (background: string) =>
    setColors((c) => ({ ...c, background }));
  const setTextStrong = (textStrong: string) =>
    setColors((c) => ({ ...c, textStrong }));
  const setPrimary = (primary: string) =>
    setColors((c) => ({ ...c, primary }));
  const reset = () => setColors(DEFAULT_COLORS);

  return { colors, setBackground, setTextStrong, setPrimary, reset };
}
