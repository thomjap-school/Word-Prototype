import { useEffect, useRef } from "react";

/**
 * Renvoie une ref à poser sur un conteneur : `onOutside` est appelé quand un
 * clic (mousedown) se produit en dehors de cet élément. Sert à fermer les
 * popovers/menus (recherche musique, sélecteur de couleur, menu mobile...).
 */
export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onOutside]);

  return ref;
}
