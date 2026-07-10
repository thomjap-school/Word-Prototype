# Prototype Word — Éditeur de Documents Collaboratif

Un éditeur de texte web collaboratif permettant de créer, formater et éditer des documents en temps réel avec authentification sécurisée et sauvegarde en base de données.

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Node.js 18+ (pour le développement local)
- Python 3.9+ (pour le développement local)

### Installation & Lancement avec Docker Compose

```bash
cd word_project
docker-compose up --build
```

L'application sera accessible à `http://localhost:5173` (client) et l'API à `http://localhost:8000`.

### Développement local

#### Backend (FastAPI)

```bash
cd word_project/server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

L'API démarrera sur `http://localhost:8000`

#### Frontend (React + Vite)

```bash
cd word_project/client
npm install
npm run dev
```

Le client démarrera sur `http://localhost:5173`

## Fonctionnalités

- **Authentification sécurisée** : Inscription/connexion avec email et mot de passe (JWT)
- **Éditeur de texte riche** : Formatage complet (gras, italique, titres, listes, etc.) avec TipTap
- **Gestion des documents** : Création, sauvegarde, organisation par utilisateur
- **Édition collaborative temps réel** : Plusieurs utilisateurs peuvent éditer le même document simultanément
- **Responsive design** : Interface adaptée à tous les écrans (Tailwind CSS)

## Architecture

### Stack technique

**Frontend**
- React 19 + TypeScript
- Vite (build tool)
- TipTap (éditeur de texte riche)
- React Router (navigation)
- Tailwind CSS (styling)
- Lucide React (icônes)

**Backend**
- FastAPI (framework Python moderne)
- PostgreSQL (base de données)
- JWT + bcrypt (authentification sécurisée)
- Pydantic (validation de données)

**Infrastructure**
- Docker & Docker Compose
- Yjs (pour la collaboration temps réel)

### Structure du projet

```
word_project/
├── client/                    # Application React
│   ├── src/
│   │   ├── App.tsx           # Composant principal
│   │   ├── Home.tsx          # Page d'accueil
│   │   ├── EditorPage.tsx    # Page d'édition
│   │   ├── Editor.tsx        # Composant éditeur
│   │   ├── Toolbar.tsx       # Barre d'outils
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # API FastAPI
│   ├── app/
│   │   ├── main.py           # Point d'entrée
│   │   ├── database.py       # Configuration BD
│   │   ├── models.py         # Modèles SQLAlchemy
│   │   ├── schemas.py        # Schémas Pydantic
│   │   ├── security.py       # JWT & authentification
│   │   └── routers/
│   │       ├── auth.py       # Routes d'authentification
│   │       └── ...
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml         # Orchestration services
```

<<<<<<< HEAD
## Authentification
=======
- Travail en sprints hebdomadaires d'une semaine, avec un objectif clair par semaine
- Gestion du code via un dépôt Git partagé (branches par fonctionnalité)
- Suivi des tâches simple (Kanban ou Notion : à faire / en cours / terminé)
- Mise au point chaque matin 10h30
- Groupe chat pour travail a distance
>>>>>>> e005cd3f491afcb11b8e696afbb54af5281a406f

L'authentification utilise **JWT** (JSON Web Tokens) avec les meilleures pratiques :

- Mots de passe hashés avec **bcrypt**
- Tokens JWT signés
- CORS configuré pour la sécurité

### Endpoints d'authentification

- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/logout` - Se déconnecter

<<<<<<< HEAD
## Gestion des documents
=======
| Période | Objectifs |
|---|---|
| Semaine 1 | Authentification et gestion de comptes (email/mot de passe, JWT, base de données PostgreSQL via Docker) dockerisation complète de l'application + mise en place du squelette de l'éditeur |
| Semaine 2 | Éditeur complet : formatage du texte, sauvegarde des documents liés à un compte utilisateur |
| Semaine 3 | Collaboration en temps réel avec Yjs, mise en place de ngrok pour les tests entre membres de l'équipe |
| Semaine 4 | Finitions (polish), correction des bugs, préparation de la démo finale |
>>>>>>> e005cd3f491afcb11b8e696afbb54af5281a406f

Les documents sont liés à un compte utilisateur et peuvent être :
- Créés, modifiés et supprimés
- Partagés pour édition collaborative
- Sauvegardés automatiquement

## Collaboration temps réel

Lorsque plusieurs utilisateurs éditent un même document :
- Les changements sont synchronisés en temps réel
- Les conflits sont gérés automatiquement via Yjs
- Chaque utilisateur voit les modifications des autres instantanément

## Développement

### Scripts disponibles

**Frontend**
```bash
npm run dev      # Démarrer le serveur de développement
npm run build    # Compiler pour la production
npm run lint     # Vérifier le code
npm run preview  # Prévisualiser la build production
```

**Backend**
```bash
uvicorn app.main:app --reload        # Serveur de développement
python -m pytest                      # Lancer les tests (si disponibles)
```

### Variables d'environnement

#### Backend (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost/word_db
SECRET_KEY=your-secret-key-here
```

#### Frontend (`.env`)
```
VITE_API_URL=http://localhost:8000
```

## Déploiement

### Avec Docker Compose

```bash
docker-compose up -d
```

Le service s'exécute en arrière-plan. Pour voir les logs :

```bash
docker-compose logs -f
```

### Arrêter les services

```bash
docker-compose down
```

## Tests

Tests à effectuer :

- [ ] Inscription et connexion
- [ ] Création et édition de documents
- [ ] Collaboration temps réel avec plusieurs navigateurs
- [ ] Navigation entre documents
- [ ] Formatage du texte (gras, italique, listes, titres)
- [ ] Persistance des données après déconnexion/reconnexion

## Documentation supplémentaire

Voir [Projet_word.md](Projet_word.md) pour la fiche projet détaillée, les objectifs, les risques et la planification.

## Limitations connues

- Export PDF/Word non disponible en MVP
- Pas de gestion fine des permissions par document
- Pas de suivi des modifications ou historique de versions
- Authentification simple (pas d'OAuth)

## Contribution

1. Créer une branche pour chaque fonctionnalité (`git checkout -b feature/ma-feature`)
2. Commiter les changements (`git commit -m "Add ma-feature"`)
3. Pousser la branche (`git push origin feature/ma-feature`)
4. Créer une Pull Request
