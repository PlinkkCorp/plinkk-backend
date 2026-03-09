<div align="center">

# 🔗 Plinkk — Backend

**Alternative moderne et professionnelle à Linktree**

![build](https://img.shields.io/badge/build-passing-brightgreen) ![bun](https://img.shields.io/badge/bun-1.3.10-f9f1e1?logo=bun) ![typescript](https://img.shields.io/badge/typescript-5.9-blue?logo=typescript) ![prisma](https://img.shields.io/badge/prisma-7.3-2D3748?logo=prisma) ![fastify](https://img.shields.io/badge/fastify-5.6-000000?logo=fastify)

Infrastructure backend moderne basée sur **Bun**, **Fastify** et **TypeScript strict**

[Fonctionnalités](#-fonctionnalités-principales) • [Architecture](#-architecture) • [Installation](#-installation-rapide) • [Documentation](#-documentation)

</div>

---

## ✨ Fonctionnalités Principales

### 🎨 Expérience Utilisateur
- **Live Preview Sync** — Prévisualisation temps réel dans l'iframe du dashboard via `postMessage`
- **Thèmes Personnalisables** — Création et gestion de thèmes visuels pour les pages Plinkk
- **Analytics Avancées** — Statistiques détaillées avec filtres temporels et granularité configurable
- **UI Moderne** — Design Glassmorphism pour l'interface Premium et le dashboard

### 🔐 Authentification & Sécurité
- **OAuth2 Multi-Provider** — GitHub, Discord, Google
- **2FA/TOTP** — Authentification à deux facteurs avec génération QR Code
- **Magic Links** — Connexion sans mot de passe par email
- **Sessions Sécurisées** — Chiffrement côté serveur avec `@fastify/secure-session`
- **Rate Limiting** — Protection IP et limitation des requêtes
- **RBAC Granulaire** — Système de rôles et permissions dynamique

### 💰 Monétisation
- **Stripe Integration** — Paiements sécurisés et webhooks
- **Abonnements Flexibles** — Premium mensuel ou lifetime
- **Add-ons** — Pages supplémentaires, redirections, QR codes
- **Quotas Dynamiques** — Limites configurables par rôle (`maxPlinkks`, `maxThemes`)

### 📧 Emails & Communication
- **Service Email (Resend)** — Envoi transactionnel professionnel
- **Email Alias/Forwarding** — Création d'adresses personnalisées avec relais
- **Templates HTML** — Bienvenue, vérification, reset password, notifications
- **Quota Management** — Limitation mensuelle configurable (3000 emails/mois gratuit)

### 🛠️ Administration
- **Bug Reports System** — Interface complète de gestion des rapports utilisateurs
- **Admin Logs** — Historique détaillé des actions d'administration
- **User Logs** — Traçabilité des actions utilisateurs
- **Annonces Système** — Communication ciblée par rôle
- **Mode Maintenance** — Activation avec accès staff préservé

### ⚡ Performance & Infrastructure
- **Cache In-Memory** — Système de cache LRU configurable (TTL, max size)
- **Cron Jobs** — Nettoyage automatique (sessions expirées, comptes inactifs)
- **AWS S3 Integration** — Stockage d'assets (avatars, uploads)
- **Discord Webhooks** — Notifications et intégrations
- **CDN Ready** — Optimisation et compression des assets

---

## 🏗️ Architecture

**Monorepo pnpm workspaces** avec une séparation claire des responsabilités :

```
plinkk-backend/
├── apps/
│   ├── dashboard/          # API dashboard & admin (port 3001)
│   │   ├── src/server/api/ # Routes API par domaine
│   │   ├── src/services/   # Logique métier
│   │   ├── src/middleware/ # Auth, rate-limit, validation
│   │   └── src/views/      # Templates EJS dashboard
│   │
│   └── public/             # Pages publiques des profils (port 3002)
│       ├── src/server/     # Rendu des Plinkks utilisateurs
│       └── src/views/      # Templates EJS publics
│
├── packages/
│   ├── prisma/             # Client Prisma partagé
│   │   ├── prisma/         # Schema, migrations
│   │   ├── permissions.ts  # Définitions RBAC
│   │   └── index.ts        # Export client généré
│   │
│   └── shared/             # Code commun
│       ├── src/lib/        # Utilitaires partagés
│       ├── src/types/      # Types TypeScript
│       └── views/partials/ # Composants EJS réutilisables
│
└── scripts/                # Scripts d'administration
    ├── seed-permissions.js
    ├── set-admin.cjs
    └── ...
```

### Principes d'Architecture

- **Separation of Concerns** — Dashboard vs Public strictement isolés
- **Service Layer** — Logique métier encapsulée (ex: `plinkkService`, `themeService`)
- **Schema Validation** — Zod pour toutes les entrées utilisateur
- **Error Handling** — Classes d'erreurs typées (`UnauthorizedError`, `NotFoundError`)
- **Type Safety** — TypeScript strict mode, zero `any`

---

## 🛠️ Stack Technique

### Core
- **Runtime** — [Bun 1.3.10](https://bun.sh) (ultra-rapide, compatible Node.js)
- **Framework** — [Fastify 5.6](https://fastify.dev) (serveur HTTP performant)
- **Langage** — TypeScript 5.9 (strict mode)
- **Templates** — EJS (Server-Side Rendering)

### Base de Données
- **ORM** — Prisma 7.3 (type-safe query builder)
- **Production** — PostgreSQL (via `@prisma/adapter-pg`)
- **Développement** — SQLite (option légère)
- **Migrations** — Prisma Migrate

### Authentification & Sécurité
- **OAuth2** — `@fastify/oauth2` (GitHub, Discord, Google)
- **Sessions** — `@fastify/secure-session` (chiffrement AES-256-GCM)
- **2FA** — `@otplib/preset-default` (TOTP)
- **Password Hashing** — bcrypt (cost factor 10) & Bun.password
- **Validation** — Zod 4.1

### Infrastructure & Services
- **Storage** — AWS S3 (`@aws-sdk/client-s3`)
- **Email** — Resend (API transactionnelle)
- **Paiements** — Stripe (webhooks, subscriptions)
- **Cron Jobs** — `fastify-cron`
- **Rate Limiting** — `@fastify/rate-limit`
- **Cache** — Custom in-memory LRU cache

### Outils
- **Image Processing** — Sharp (resize, compress)
- **QR Codes** — qrcode
- **Markdown** — marked
- **Compression** — `@fastify/compress`
- **CORS** — `@fastify/cors`

---

## 🚀 Installation Rapide

### Prérequis

- [Bun](https://bun.sh) 1.3.10+ (ou Node.js 18+ avec pnpm)
- PostgreSQL 14+ (ou SQLite pour développement local)
- Git

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/PlinkkCorp/plinkk-backend.git
cd plinkk-backend

# 2. Installer les dépendances (génère automatiquement Prisma)
bun install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# 4. Générer la clé de session
cd apps/dashboard
bunx @fastify/secure-session > src/secret-key
cd ../public
bunx @fastify/secure-session > src/secret-key
cd ../..

# 5. Initialiser la base de données
bun run prisma:init           # Applique les migrations
bun run seed-permissions      # Insère les permissions

# 6. (Optionnel) Créer un compte admin
bun run set-admin

# 7. Lancer les serveurs
bun run launch-all            # Dashboard (3001) + Public (3002)
```

---

## 🔧 Commandes Utiles

### Développement

```bash
# Lancer les deux apps simultanément
bun run launch-all

# Lancer individuellement
bun run dev:dashboard         # Port 3001
bun run dev:public            # Port 3002

# Build production
bun run build                 # Build all packages
bun run build:dashboard       # Dashboard seul
bun run build:public          # Public seul
```

### Base de Données

```bash
# Appliquer les migrations
bun run prisma:init

# Mode développement (création auto)
bun run prisma:dev

# Générer le client Prisma
bun run prisma:generate

# Interface graphique
bun run prisma:studio
```

### Scripts d'Administration

```bash
# Seed permissions & rôles
bun run seed-permissions

# Promouvoir un utilisateur admin
bun run set-admin

# Supprimer comptes inactifs (+3 ans)
bun run delete_inactive

# Migrer des données Plinkk
bun run migrate:plinkks
```

---

## 🔐 Variables d'Environnement

Créez un fichier `.env` à la racine avec les variables suivantes :

### Essentielles

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/plinkk"

# Sessions (générer avec @fastify/secure-session)
SESSION_SECRET="your-session-secret"

# Ports
PORT_DASHBOARD=3001
PORT_PUBLIC=3002
```

### OAuth2 (optionnel)

```env
# GitHub
GITHUB_OAUTH2_ID="your_github_client_id"
GITHUB_OAUTH2_SECRET="your_github_client_secret"

# Discord
DISCORD_OAUTH2_ID="your_discord_client_id"
DISCORD_OAUTH2_SECRET="your_discord_client_secret"

# Google
GOOGLE_OAUTH2_ID="your_google_client_id"
GOOGLE_OAUTH2_SECRET="your_google_client_secret"
```

### Services Externes

```env
# Emails (Resend)
RESEND_API_KEY="re_..."

# Paiements (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Storage (AWS S3)
AWS_ACCESS_KEY_ID="your_key"
AWS_SECRET_ACCESS_KEY="your_secret"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="plinkk-uploads"

# Discord Webhooks (notifications)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

---

## 📚 Documentation

### Patterns de Code

- **Routes API** — Organisation par domaine dans `apps/dashboard/src/server/api/`
- **Middlewares** — Authentication, validation, rate-limiting dans `src/middleware/`
- **Services** — Logique métier isolée dans `src/services/`
- **Validation** — Schémas Zod dans `src/schemas/`
- **Erreurs** — Classes typées dans `src/lib/errors.ts`

### Exemple de Route

```typescript
// apps/dashboard/src/server/api/plinkks.ts
export function apiPlinkksRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.userId;
    const plinkks = await prisma.plinkk.findMany({
      where: { ownerId: userId }
    });
    return { data: plinkks };
  });
}
```

### Rôles & Permissions

Le système RBAC permet un contrôle granulaire :

```typescript
// Vérifier si l'user est staff (ADMIN, DEVELOPER, MODERATOR)
import { verifyRoleIsStaff } from "../lib/verifyRole";

if (!verifyRoleIsStaff(user.role)) {
  throw new ForbiddenError("Accès réservé au staff");
}
```

**Ajouter une permission :**

1. Définir dans `packages/prisma/permissions.ts`
2. Exécuter `bun run seed-permissions`
3. Assigner via `/admin/roles`

### Service Email

```typescript
// Envoyer un email
import { emailService } from "../services/emailService";

await emailService.sendWelcomeEmail(user.email, user.name);
await emailService.sendPasswordReset(user.email, user.name, resetToken);
```

**Tester :** `bun --filter @plinkk/dashboard test:email`

### Cache

```typescript
import { SimpleCache } from "../lib/cache";

const userCache = new SimpleCache({ maxSize: 100, ttl: 60000 });

// Set
userCache.set(`user:${userId}`, userData);

// Get
const cached = userCache.get(`user:${userId}`);

// Invalidate
userCache.delete(`user:${userId}`);
```

---

## 🐳 Docker

Les Dockerfiles sont disponibles pour chaque app :

```bash
# Build Dashboard
docker build -f DockerfileDash -t plinkk-dashboard .

# Build Public
docker build -f DockerfilePublic -t plinkk-public .

# Run
docker run -p 3001:3001 --env-file .env plinkk-dashboard
docker run -p 3002:3002 --env-file .env plinkk-public
```

---

## 🤝 Dépannage

### Erreur `PrismaClient is not defined`

```bash
bun run prisma:generate
# ou
bun install
```

### Modifications CSS non appliquées

Le cache peut conserver d'anciennes versions :

```bash
# Redémarrer les serveurs
bun run launch-all
```

### Preview iframe affiche 404

Vérifiez que l'app `public` tourne sur le bon port et que l'URL est configurée dans `.env` :

```env
PUBLIC_URL="http://localhost:3002"
```

### Sessions ne persistent pas

Vérifiez que le fichier `src/secret-key` existe dans les deux apps :

```bash
cd apps/dashboard && bunx @fastify/secure-session > src/secret-key
cd ../public && bunx @fastify/secure-session > src/secret-key
```

---

## 📊 Modèles de Données Clés

Le schéma Prisma (`packages/prisma/prisma/schema.prisma`) définit :

- **User** — Utilisateurs (2FA, email verified, roleId, quotas)
- **Connection** — OAuth2 connections (GitHub, Discord, Google)
- **Session** — Sessions actives avec expiration
- **Plinkk** — Pages de profil personnalisées par user
- **Link** — Liens affichés sur les Plinkks
- **Theme** — Thèmes visuels personnalisables
- **Role & Permission** — RBAC (staff, maxPlinkks, maxThemes)
- **BugReport** — Rapports de bugs utilisateurs
- **Announcement** — Annonces système ciblées
- **MagicLink** — Tokens pour connexion sans password
- **Label, Category, Host** — Organisation des liens

---

## 📄 Licence

**Licence Propriétaire Plinkk**

© 2024-2026 Plinkk Corporation. Tous droits réservés.

Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**[Documentation Complète](docs/)** • **[API Reference](docs/API.md)** • **[Contributing](CONTRIBUTING.md)**

Développé avec ❤️ par l'équipe Plinkk

</div>
