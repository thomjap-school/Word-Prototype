/**
 * Initiales dérivées d'un nom complet : première lettre de chaque mot, en
 * majuscules. Ex. "Jean Dupont" -> "JD". Utilisé pour l'avatar du header.
 */
export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
