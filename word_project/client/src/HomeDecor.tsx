/**
 * Formes géométriques décoratives et animées affichées en fond de la Home.
 * Purement décoratif : aucune interaction, masqué aux lecteurs d'écran.
 * Les couleurs suivent le thème dynamique (variables --color-* de shared.css)
 * et les animations se coupent automatiquement via prefers-reduced-motion.
 */
export default function HomeDecor() {
  return (
    <div className="home-decor" aria-hidden="true">
      {/* Côté gauche */}
      <span className="deco deco--circle deco--l1" />
      <span className="deco deco--ring deco--l2" />
      <span className="deco deco--square deco--l3" />
      <span className="deco deco--triangle deco--l4" />

      {/* Côté droit */}
      <span className="deco deco--ring deco--r1" />
      <span className="deco deco--circle deco--r2" />
      <span className="deco deco--square deco--r3" />
      <span className="deco deco--triangle deco--r4" />

      {/* Halos flous d'ambiance */}
      <span className="deco deco--blob deco--b1" />
      <span className="deco deco--blob deco--b2" />
    </div>
  )
}
