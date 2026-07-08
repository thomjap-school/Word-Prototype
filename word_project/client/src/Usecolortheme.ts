import { useEffect, useState } from "react";

const STORAGE_KEY = "app-color-theme";

export interface ColorTheme {
  id: string;
  label: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  background: string;
  textStrong: string;
}

export const THEMES: ColorTheme[] = [
  {
    id: "blue", label: "Bleu",
    primary: "#2563eb", primaryHover: "#1d4ed8", primaryLight: "#eff6ff",
    primaryBorder: "#93c5fd", background: "#eff6ff", textStrong: "#1e3a8a",
  },
  {
    id: "violet", label: "Violet",
    primary: "#7c3aed", primaryHover: "#6d28d9", primaryLight: "#f5f3ff",
    primaryBorder: "#c4b5fd", background: "#f5f3ff", textStrong: "#4c1d95",
  },
  {
    id: "green", label: "Vert",
    primary: "#16a34a", primaryHover: "#15803d", primaryLight: "#f0fdf4",
    primaryBorder: "#86efac", background: "#f0fdf4", textStrong: "#14532d",
  },
  {
    id: "rose", label: "Rose",
    primary: "#e11d48", primaryHover: "#be123c", primaryLight: "#fff1f2",
    primaryBorder: "#fda4af", background: "#fff1f2", textStrong: "#881337",
  },
  {
    id: "orange", label: "Orange",
    primary: "#ea580c", primaryHover: "#c2410c", primaryLight: "#fff7ed",
    primaryBorder: "#fdba74", background: "#fff7ed", textStrong: "#7c2d12",
  },
];

function applyTheme(theme: ColorTheme) {
  const root = document.documentElement.style;
  root.setProperty("--color-primary", theme.primary);
  root.setProperty("--color-primary-hover", theme.primaryHover);
  root.setProperty("--color-primary-light", theme.primaryLight);
  root.setProperty("--color-primary-border", theme.primaryBorder);
  root.setProperty("--color-bg", theme.background);
  root.setProperty("--color-text-strong", theme.textStrong);
}

export function useColorTheme() {
  const [themeId, setThemeIdState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || "blue"
  );

  useEffect(() => {
    const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
    applyTheme(theme);
  }, [themeId]);

  const setThemeId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeIdState(id);
  };

  return { themeId, setThemeId, themes: THEMES };
}
