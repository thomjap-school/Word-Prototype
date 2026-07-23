# Prototype Word — Éditeur de Documents Collaboratif

Un éditeur de texte web collaboratif permettant de créer, formater et éditer
des documents en temps réel, avec authentification sécurisée (email + Google),
partage entre utilisateurs et sauvegarde en base de données.

## Fonctionnalités

- **Authentification** : inscription / connexion par email + mot de passe (JWT),
  connexion **Google OAuth**, vérification d'email, et suppression de compte
  « douce » (3 jours de délai de grâce avec réactivation).
- **Éditeur riche** (TipTap) : titres, gras/italique/souligné/barré, listes,
  citations, alignement, couleurs, surlignage, polices, liens, compteur de mots.
- **Import / Export** : export **PDF, Word (.docx), TXT, Markdown, RTF, ODT**
  et import **.docx / .pdf**.
- **Gestion des documents** : création depuis des modèles, renommage,
  suppression, liste des documents récents par utilisateur.
- **Collaboration temps réel** (Yjs / Hocuspocus) : édition simultanée,
  curseurs des autres participants, résolution automatique des conflits.
- **Partage** : invitation d'un collaborateur par email ou via un lien de partage.
- **Confort** : thème de couleurs personnalisable, lecteur de musique intégré,
  design responsive (Tailwind CSS)… et quelques easter eggs.

## Stack technique

**Frontend** (`word_project/client`)
- React 19 + TypeScript, Vite (build/dev server)
- TipTap 3 (éditeur), Yjs + `@hocuspocus/provider` (collaboration)
- React Router 7, Tailwind CSS 4, Lucide (icônes)

**Backend** (`word_project/server`)
- FastAPI + SQLAlchemy, migrations Alembic
- Base **SQLite** par défaut (`wordv2.db`), configurable via `DATABASE_URL`
- JWT + bcrypt, Pydantic (validation), envoi d'emails SMTP (optionnel)

**Serveur de collaboration** (`word_project/collab`)
- Hocuspocus (WebSocket Yjs) sur le port `1234`, persistance déléguée au
  backend via des routes internes protégées par `INTERNAL_SECRET`.

**Infrastructure**
- Docker & Docker Compose (services `backend`, `collab`, `frontend`)

## Démarrage rapide (Docker Compose)

Méthode recommandée pour lancer le projet **sur une machine vierge** : seul
Docker est requis (ni Node, ni Python, ni base de données à installer à la main).

### Prérequis
- Git
- Docker & Docker Compose v2 (commande `docker compose`)

### 1. Cloner le dépôt
```bash
git clone <url-du-depot> wordv2
cd wordv2/word_project
```

### 2. Créer les fichiers d'environnement
Docker Compose lit **deux** fichiers `.env` : celui de la racine du projet et
celui du backend. On les crée depuis les exemples fournis :
```bash
cp .env.example .env                 # racine : INTERNAL_SECRET, GOOGLE_CLIENT_ID
cp server/.env.example server/.env   # backend : SECRET_KEY, SMTP, etc.
```
Valeurs minimales pour que ça démarre :
- `.env` → **`INTERNAL_SECRET`** est obligatoire (ex. `openssl rand -hex 32`).
  `GOOGLE_CLIENT_ID` est optionnel : sans lui, la connexion Google est
  simplement masquée.
- `server/.env` → renseigner **`SECRET_KEY`** (signature des tokens JWT).

> Le fichier `client/.env` n'est **pas** nécessaire avec Docker : la config du
> frontend est fournie directement par `docker-compose.yml`.

### 3. Lancer
```bash
docker compose up --build
```
La base **SQLite** et ses tables sont créées automatiquement au premier
démarrage du backend — aucune migration à lancer manuellement.

Une fois démarré :
- Frontend : `http://localhost:5173`
- API : `http://localhost:8000` (docs interactives sur `/docs`)
- Serveur de collaboration : `ws://localhost:1234`

Pour arrêter les services : `docker compose down`.

## Développement local (sans Docker)

### Backend (FastAPI)
```bash
cd word_project/server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env           # renseigner au moins SECRET_KEY
uvicorn app.main:app --reload  # API sur http://localhost:8000
```

Les tables SQLite sont créées automatiquement au démarrage ; Alembic ne sert
qu'à faire évoluer le schéma ensuite (`alembic upgrade head`).

### Serveur de collaboration (Hocuspocus)
```bash
cd word_project/collab
npm install
npm start                     # WebSocket Yjs sur le port 1234
```

### Frontend (React + Vite)
```bash
cd word_project/client
npm install
cp .env.example .env          # voir la note ci-dessous
npm run dev                   # http://localhost:5173
```

> Hors Docker, le proxy Vite cible les noms de services Docker (`backend`,
> `collab`) qui n'existent pas en local. Dans `client/.env`, mettre alors
> `VITE_API_URL=http://localhost:8000` et `VITE_COLLAB_WS_URL=ws://localhost:1234`.

## Variables d'environnement

Chaque dossier fournit un `.env.example` à copier en `.env`.

**Racine `word_project/.env`** (utilisé par Docker Compose)

| Variable | Rôle |
|---|---|
| `INTERNAL_SECRET` | Secret partagé backend ↔ collab pour les appels internes (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | Client ID OAuth 2.0 Google (partagé backend + frontend) |

**Backend `word_project/server/.env`**

| Variable | Rôle |
|---|---|
| `SECRET_KEY` | Clé de signature des tokens JWT |
| `CORS_ORIGINS` | Origines autorisées (défaut `http://localhost:5173`) |
| `DATABASE_URL` | URL de la base (défaut `sqlite:///./wordv2.db`) |
| `FRONTEND_URL` | Base de l'URL des liens de confirmation email |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google (vérification du token) |
| `SMTP_*` | Compte SMTP pour l'envoi des emails (sinon l'email est loggé) |

**Frontend `word_project/client/.env`**

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | Base de l'API (`/api` en Docker via proxy Vite, sinon `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth Google (bouton « Se connecter avec Google ») |

## Structure du projet

```
word_project/
├── client/                 # Application React (voir client/README.md)
│   └── src/
│       ├── main.tsx  App.tsx
│       ├── pages/          # Écrans de route (Home, Editor, Login, Profile…)
│       ├── components/     # UI par domaine (auth, editor, music, layout, decor)
│       ├── services/       # Accès API (http, authService, documentService)
│       ├── hooks/          # Hooks réutilisables (useClickOutside, useLogout…)
│       ├── utils/          # Fonctions pures partagées
│       └── styles/         # CSS global (index.css, shared.css)
│
├── server/                 # API FastAPI
│   ├── app/
│   │   ├── main.py         # Point d'entrée + CORS + route /visitor
│   │   ├── database.py     # Config SQLAlchemy (SQLite)
│   │   ├── models.py       # Modèles ORM
│   │   ├── schemas.py      # Schémas Pydantic
│   │   ├── security.py     # JWT, bcrypt, secret interne
│   │   ├── email.py        # Envoi des emails de confirmation
│   │   └── routers/
│   │       ├── auth.py     # /auth/*
│   │       └── documents.py# /documents/*
│   ├── alembic/            # Migrations de base de données
│   └── requirements.txt
│
├── collab/                 # Serveur de collaboration Hocuspocus (Yjs)
│   └── server.js
│
└── docker-compose.yml      # Orchestration backend + collab + frontend
```

## API

Base : `http://localhost:8000` (routes sans préfixe `/api` ; en Docker, le
frontend passe par le proxy Vite `/api`).

**Authentification — `/auth`**

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte |
| `POST` | `/auth/login` | Se connecter |
| `POST` | `/auth/google` | Connexion via Google OAuth |
| `POST` | `/auth/reactivate` | Réactiver un compte en attente de suppression |
| `GET` | `/auth/verify-email` | Confirmer l'email (via lien) |
| `POST` | `/auth/resend-verification` | Renvoyer l'email de confirmation |
| `GET` | `/auth/me` | Profil courant |
| `PUT` | `/auth/me` | Modifier son profil |
| `PUT` | `/auth/me/password` | Changer son mot de passe |
| `DELETE` | `/auth/me` | Supprimer son compte (délai de grâce) |

**Documents — `/documents`**

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/documents` | Lister ses documents |
| `POST` | `/documents` | Créer un document |
| `GET` | `/documents/{id}` | Récupérer un document |
| `PUT` | `/documents/{id}` | Mettre à jour (titre / contenu) |
| `DELETE` | `/documents/{id}` | Supprimer un document |
| `POST` | `/documents/{id}/invite` | Inviter un collaborateur par email |
| `DELETE` | `/documents/{id}/collaborators/{user_id}` | Retirer un collaborateur |
| `POST` | `/documents/{id}/share-link` | Générer un lien de partage |
| `POST` | `/documents/join/{token}` | Rejoindre un document via un lien |

## Collaboration temps réel

Le contenu de l'éditeur transite exclusivement par **Yjs** via le serveur
**Hocuspocus** (`collab/`) : chaque document est une « room » synchronisée en
WebSocket. Le backend REST ne gère que le titre, les métadonnées et un snapshot
de sauvegarde (Ctrl/Cmd+S) ; il ne réécrit jamais le contenu Yjs pour éviter
les collisions. Hocuspocus persiste le document en appelant des routes internes
du backend, authentifiées par `INTERNAL_SECRET`.

## Scripts utiles

**Frontend** (`client/`)
```bash
npm run dev       # serveur de développement
npm run build     # build de production (tsc + vite build)
npm run lint      # analyse ESLint
npm run preview   # prévisualiser la build
```

**Backend** (`server/`)
```bash
uvicorn app.main:app --reload   # serveur de développement
alembic upgrade head            # appliquer les migrations
alembic revision --autogenerate -m "message"  # créer une migration
```

## Documentation & organisation

- Fiche projet détaillée (objectifs, risques, planning) : [Projet_word.md](Projet_word.md)
- Documentation du frontend : [word_project/client/README.md](word_project/client/README.md)

Organisation de l'équipe :
- Sprints hebdomadaires avec un objectif clair par semaine
- Gestion du code via Git (une branche par fonctionnalité, intégration sur `devlop`)
- Suivi des tâches en Kanban (à faire / en cours / terminé)
- Point quotidien à 10h30, chat d'équipe pour le travail à distance

| Période | Objectifs |
|---|---|
| Semaine 1 | Authentification et gestion de comptes (JWT, base de données, dockerisation) + squelette de l'éditeur |
| Semaine 2 | Éditeur complet : formatage du texte, sauvegarde des documents par compte |
| Semaine 3 | Collaboration temps réel (Yjs), tests entre membres via ngrok |
| Semaine 4 | Finitions, correction des bugs, préparation de la démo |

## Contribution

1. Créer une branche par fonctionnalité (`git switch -c feature/ma-feature`)
2. Commiter les changements (`git commit -m "feat: ma-feature"`)
3. Pousser la branche (`git push origin feature/ma-feature`)
4. Ouvrir une Pull Request vers `devlop`
