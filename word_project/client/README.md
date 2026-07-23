# Client — Prototype Word

Frontend de l'éditeur de documents collaboratif : **React 19 + TypeScript**,
build avec **Vite**, éditeur **TipTap**, collaboration temps réel via
**Yjs / Hocuspocus**, styling **Tailwind CSS 4**.

Ce README documente uniquement le frontend. Pour l'ensemble du projet (backend,
serveur de collaboration, Docker), voir le [README racine](../../README.md).

## Démarrage

```bash
npm install
cp .env.example .env     # renseigner VITE_GOOGLE_CLIENT_ID si besoin
npm run dev              # http://localhost:5173
```

Le frontend a besoin que le **backend** (`../server`, port 8000) et le
**serveur de collaboration** (`../collab`, port 1234) tournent en parallèle —
le plus simple est de lancer l'ensemble via `docker compose up` depuis
`word_project/` (voir README racine).

## Scripts

```bash
npm run dev       # serveur de développement (HMR)
npm run build     # build de production : tsc -b && vite build
npm run lint      # analyse ESLint
npm run preview   # prévisualiser la build de production
```

## Variables d'environnement

Copier `.env.example` vers `.env` :

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | Base de l'API REST. `/api` en Docker (proxy Vite → backend), `http://localhost:8000` en local direct. |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth 2.0 Google. S'il est absent, le bouton « Se connecter avec Google » n'apparaît simplement pas. |
| `VITE_COLLAB_WS_URL` | (Optionnel) Override de l'URL WebSocket de collaboration. Par défaut, même origine que la page via le proxy `/collab-ws`. |

Le proxy de développement (`/api` → backend, `/collab-ws` → collab) est
configuré dans [`vite.config.ts`](vite.config.ts).

## Organisation de `src/`

Le code est rangé par domaine plutôt qu'à plat :

```
src/
├── main.tsx              # Point d'entrée (monte <App/>, importe le CSS global)
├── App.tsx               # Définition des routes (React Router)
│
├── pages/                # Un composant par écran de route
│   ├── Home.tsx            # Liste des documents + création depuis modèles
│   ├── EditorPage.tsx      # En-tête + éditeur
│   ├── LoginPage.tsx / RegisterPage.tsx / VerifyEmailPage.tsx
│   ├── ProfilePage.tsx     # Profil, mot de passe, suppression de compte
│   └── JoinPage.tsx        # Rejoindre un document via un lien de partage
│
├── components/           # Composants d'UI regroupés par domaine
│   ├── auth/               # ProtectedRoute, GoogleSignInButton
│   ├── editor/             # Editor, Toolbar, ShareDialog, ExportImportMenu,
│   │                       #   exportImport.ts (logique d'import/export)
│   ├── music/              # MusicPlayer, MusicPlayerContext, ncsTracks
│   ├── layout/             # MobileMenu, ColorThemePicker
│   └── decor/              # HomeDecor + easter eggs (KonamiSnake, KonamiSpaceInvaders)
│
├── services/             # Accès réseau (aucune UI)
│   ├── http.ts             # API_URL, en-têtes authentifiés, parseur de réponse
│   ├── authService.ts      # Endpoints /auth (login, register, profil, Google…)
│   └── documentService.ts  # Endpoints /documents (CRUD, partage, collaborateurs)
│
├── hooks/                # Hooks React réutilisables
│   ├── useClickOutside.ts  # Ferme un popover au clic extérieur
│   ├── useLogout.ts        # Déconnexion + redirection vers /login
│   └── useColorTheme.ts    # Thème de couleurs (variables CSS + localStorage)
│
├── utils/                # Fonctions pures partagées
│   └── initials.ts         # Initiales d'un nom (avatar du header)
│
└── styles/               # CSS global
    ├── index.css           # Import Tailwind + shared.css + styles éditeur
    └── shared.css          # Design system (variables --color-*, composants)
```

### Conventions

- **`pages/`** contient les écrans mappés à une route dans `App.tsx` ;
  **`components/`** contient les briques d'UI réutilisées par ces pages.
- **`services/`** ne contient que des appels réseau ; toute la logique HTTP
  commune (URL de base, en-tête `Authorization`, gestion d'erreur) vit dans
  `services/http.ts` pour éviter la duplication.
- **`hooks/`** et **`utils/`** regroupent le code partagé par ≥ 2 endroits.
- Le contenu de l'éditeur est synchronisé **uniquement** via Yjs / WebSocket ;
  le REST ne gère que le titre, les métadonnées et le snapshot de sauvegarde
  (Ctrl/Cmd+S). Voir les commentaires dans [`components/editor/Editor.tsx`](src/components/editor/Editor.tsx).

## Stack

React 19 · TypeScript · Vite · React Router 7 · Tailwind CSS 4 · TipTap 3 ·
Yjs + `@hocuspocus/provider` · Lucide (icônes) · html2pdf / mammoth / pdf.js /
turndown / jszip (import & export de documents).
