# Plinkk Backend

Backend Node.js/TypeScript pour le projet [Plinkk](https://github.com/PlinkkCorp/plinkk), une alternative moderne à Linktree.

## 🚀 Fonctionnalités

- Authentification (inscription, connexion, session sécurisée)
- Génération dynamique de profils utilisateurs
- API pour servir les assets, images, fichiers JS/CSS personnalisés
- Intégration avec Prisma (SQLite (_pour le développement_), PostgreSQL)
- Sécurité renforcée (bcrypt, validation Zod, cookies sécurisés)
- Rendu côté serveur avec EJS

## 🏗️ Stack technique

- [Fastify](https://www.fastify.io/) (serveur web)
- [Prisma](https://www.prisma.io/) (ORM)
- [SQLite](https://www.sqlite.org/) (base de données)
- [TypeScript](https://www.typescriptlang.org/)
- [EJS](https://ejs.co/) (templates)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) (hash de mot de passe)
- [Zod](https://zod.dev/) (validation)

## 📦 Installation

1. **Cloner le repo**

   ```bash
   git clone https://github.com/PlinkkCorp/plinkk-backend.git
   cd plinkk-backend
   ```
## Plinkk — Backend

Bienvenue dans le backend de Plinkk (Node.js + TypeScript). Ce dépôt sert l'API, le rendu côté serveur (EJS) et les endpoints pour les pages « Plinkk ».

Badges: [build] [prisma] [node]

## ⚡ Points saillants

- Serveur rapide avec Fastify
- TypeScript + Prisma (client généré dans `generated/prisma/`)
- Templates EJS pour rendu serveur
- Auth (bcrypt, sessions sécurisées)
- Support multi-pages par utilisateur (slugs / index)

## 🚀 Prérequis

- Node.js 18+ (ou version LTS compatible)
- pnpm (recommandé) ou npm
- PostgreSQL (requis en production — configurez DATABASE_URL, ex : `postgresql://user:password@host:5432/dbname`)
- SQLite peut être utilisé localement uniquement pour du développement/test (fichier : `prisma/dev.db`), mais la cible de déploiement est PostgreSQL

## Installation rapide (développement)

1. Clonez le dépôt et entrez dans le dossier:

```bash
git clone https://github.com/PlinkkCorp/plinkk-backend.git
cd plinkk-backend
```

2. Installez les dépendances:

```bash
pnpm install
```

# Plinkk — Backend

Backend Node.js + TypeScript pour le projet Plinkk (service de pages de liens).

![build](https://img.shields.io/badge/build-passing-brightgreen) ![prisma](https://img.shields.io/badge/prisma-ready-blue) ![node](https://img.shields.io/badge/node-18%2B-green)

## Résumé

- Serveur web rapide (Fastify)
- Rendu serveur avec EJS
- TypeScript + Prisma (client dans `generated/prisma/`)
- Auth sécurisée (bcrypt + sessions)
- Support multi-pages par utilisateur (slugs / index)

## Prérequis

- Node.js 18+ (ou LTS compatible)
- pnpm (recommandé) ou npm
- SQLite pour le développement (fichier: `prisma/dev.db`) ; Postgres possible en production

## Installation (développement)

1. Clonez le dépôt et entrez dans le dossier:

```bash
git clone https://github.com/PlinkkCorp/plinkk-backend.git
cd plinkk-backend
```

2. Installez les dépendances:

```bash
pnpm install
```

3. Générez la clé secrète de session (si nécessaire):

```bash
pnpm run create-key
```

4. Préparez la base de données en développement:

```bash
pnpm prisma:devdb
# ou : pnpm prisma-db-push
```

5. Lancez le serveur en mode dev:

```bash
pnpm run dev
# Ouvrez ensuite http://localhost:3000
```

## Variables d'environnement importantes

- `PORT` (ex: 3000)
- `DATABASE_URL` (dev: `file:./prisma/dev.db`; prod: Postgres URI)
- `SESSION_KEY` / `SESSION_SECRET` (générée avec `pnpm run create-key`)

Placez-les dans un fichier `.env` ou dans votre système d'environnement avant de lancer l'application.

## Scripts utiles

- `pnpm run dev` — développement (watch)
- `pnpm run build` — compilation TypeScript
- `pnpm run start` — lancer la version compilée
- `pnpm run create-key` — génère une clé de session
- `pnpm run prisma:devdb` — applique migrations locales (développement)
- `pnpm run prisma-db-push` — push schema sans migrations

Consultez `package.json` pour la liste complète.

## Architecture & routes clés

- Point d'entrée: `src/server.ts`
- Templates: `src/views/` (EJS)
- Static: `src/public/`
- Prisma client: `generated/prisma/`

Routage public principal:

- `/:username` — page par défaut
- `/:username/0` ou `/:username/default` — page par défaut
- `/:username/:index` (1..N) — pages additionnelles
- `/:username/:slug` — page par slug

Dashboard (admin / utilisateur connecté):

- `/dashboard/plinkks` — créer / modifier / supprimer / définir défaut / statistiques

Par défaut: 2 pages par utilisateur (modifiable selon rôle).

### Rôles & Permissions (nouveau)

Le système de rôles est étendu via les modèles `Role`, `Permission` et `RolePermission` (voir `packages/prisma/prisma/schema.prisma`).

Champs additionnels sur `Role`:
- `isStaff`: booléen permettant de distinguer le staff (accès admin).
- `priority`: ordre d'affichage / importance.
- `maxPlinkks`, `maxThemes`: quotas de créations par rôle.
- `limits`, `meta`: champs JSON libres pour futures extensions/quota/badges.

Permissions atomiques (ex: `MANAGE_ROLES`, `BAN_USER`, `CREATE_THEME`) sont catégorisées pour une interface ergonomique. La page d'administration `/admin/roles` permet:
- Création / suppression de rôles.
- Modification des paramètres du rôle (staff, quotas, priorité…).
- Ajout / retrait de permissions par clé.
- Visualisation de l'ensemble des permissions groupées par catégorie.

#### Ajout / modification de permissions
Définies dans `packages/prisma/permissions.ts` (source TypeScript) et `packages/prisma/permissions.js` (version runtime). Pour ajouter une permission:
1. Ajouter l'entrée à `PERMISSIONS` (clé unique en MAJUSCULES).
2. `npx prisma db push --schema=packages/prisma/prisma/schema.prisma` si le schéma évolue.
3. Exécuter le seed: `node scripts/seed-permissions.js` (met à jour rôles & permissions par défaut).

#### Seed initial
Après un clone fresh:
```bash
npx prisma db push --schema=packages/prisma/prisma/schema.prisma
node scripts/seed-permissions.js
```

#### Utilisation côté code
Pour vérifier si un utilisateur possède une permission donnée, récupérer son rôle puis ses `permissions` via Prisma, ou développer un helper (exemple pseudo-code):
```ts
async function userHasPermission(prisma, userId: string, key: string) {
   const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { permissions: true } } }});
   return !!user?.role?.permissions?.find(p => p.permissionKey === key);
}
```

#### Page d'administration
`/admin/roles` (accès staff) — EJS + JS vanilla, modulaire et extensible. Ajoutez simplement de nouvelles permissions puis seed pour les voir apparaître.

## Base de données & migrations

- Schéma: `prisma/schema.prisma`
- Fichier dev SQLite: `prisma/dev.db`
- Migrations: `prisma/migrations/`

Commandes fréquentes:

```bash
pnpm prisma:devdb       # applique les migrations locales
pnpm prisma-generate    # génère le client Prisma (postinstall)
pnpm prisma-db-push     # push schema (avec --accept-data-loss si nécessaire)
```

> En production, utilisez Postgres et `pnpm prisma:migrate:deploy` ou `npx prisma migrate deploy`.

## Sécurité

- Hash des mots de passe: bcrypt
- Sessions signées/chiffrées (fastify-secure-session ou équivalent)
- Validation des entrées: Zod

Bonnes pratiques:

- Ne commitez jamais votre clé de session dans Git
- Activez HTTPS en production

## Déploiement (notes rapides)

- Construire: `pnpm run build`
- Démarrer: `pnpm run start`
- Assurez-vous que `DATABASE_URL` pointe vers une DB accessible et que la clé de session est configurée

Exemple (container / CI):

```bash
pnpm install --prod
pnpm run build
NODE_ENV=production DATABASE_URL="postgresql://..." pnpm run start
```

## Développement & contributions

- Forkez & créez une branche `feature/xxx` ou `fix/xxx`
- Respectez les linters / formatters (PRs clairs, petits commits)
- Tests: aucun test automatisé pour l'instant — contributions bienvenues

Si vous souhaitez ajouter des tests, proposez un petit set (Jest / Vitest) pour les handlers critiques.

## Dépannage rapide

- Erreur: `PrismaClient` non trouvé → exécutez `pnpm prisma-generate` ou `pnpm install` puis `pnpm prisma:devdb`
- Erreur: port occupé → changez `PORT` ou tuez le processus
- Erreur: clé de session manquante → exécutez `pnpm run create-key` et exportez la variable

## Licence

MIT — voir le fichier `LICENSE`.

## Contacts

- Email : [contact@plinkk.fr](mailto:contact@plinkk.fr)
- Repo: [Plinkk Backend](https://github.com/PlinkkCorp/plinkk-backend)
- Frontend: [Plinkk Frontend](https://github.com/PlinkkCorp/plinkk)
