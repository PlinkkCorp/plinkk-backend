# Plinkk — Backend

Plinkk est une alternative moderne à Linktree. Ce dépôt contient l'infrastructure backend (Node.js + TypeScript) basée sur **Fastify**.

![build](https://img.shields.io/badge/build-passing-brightgreen) ![prisma](https://img.shields.io/badge/prisma-ready-blue) ![node](https://img.shields.io/badge/node-18%2B-green) ![typescript](https://img.shields.io/badge/typescript-strict-blue)

---

## ✨ Nouvelles Fonctionnalités & Systèmes Récents

Plinkk a récemment évolué pour inclure des fonctionnalités avancées et une architecture plus robuste :

- **Live Preview Sync (Temps Réel) :** Prévisualisation instantanée dans l'iframe du dashboard via `postMessage`, sans rechargement de page.
- **Service d'Alias Email (Mail Alias) :** Création d'adresses email personnalisées agissant comme relais/forwarding vers l'adresse réelle de l'utilisateur.
- **Système de Bug Reports & Logs :** Interface d'administration complète pour gérer les rapports de bugs utilisateurs, avec historique d'actions (résolution, réponses) et annonces système.
- **Analytiques Avancées :** Filtrage avancé des statistiques avec sélection de plages horaires (time ranges) et différentes granularités de données.
- **Système RBAC Avancé (Rôles & Permissions) :** Contrôle granulaire des accès (`isStaff`, quotas `maxPlinkks`, `maxThemes`) gérable dynamiquement depuis l'admin.
- **Page de Tarification (Premium) :** UI moderne (Glassmorphism) pour la comparaison des plans et mise en avant de l'abonnement Premium.
- **Refonte TypeScript :** Codebase entièrement typée, éliminant les types implicites pour une sécurité maximale à la compilation.

## 🏗️ Architecture

Le projet est divisé en plusieurs paquets (workspaces) pour faciliter la maintenance :

- `apps/dashboard` : Interface de gestion pour les utilisateurs connectés et l'administration système.
- `apps/public` : L'application servant les pages publiques (les "Plinkks") des utilisateurs.
- `packages/shared` : Composants EJS partagés, utilitaires, types et logiques communes.
- `packages/prisma` : Schéma de base de données Prisma, migrations et client généré.

## 🛠️ Stack Technique

- **Serveur :** Fastify
- **Moteur de template :** EJS (Rendu côté serveur)
- **Base de données :** PostgreSQL (via Prisma ORM) / SQLite pour le dev
- **Sécurité :** bcrypt, Zod (validation), fastify-secure-session

---

## 🚀 Prérequis

- Node.js 18+ (ou LTS compatible)
- `pnpm` (recommandé pour les workspaces)
- PostgreSQL (Recommandé en production — configurer `DATABASE_URL`)

## 📦 Installation & Démarrage (Développement)

1. **Cloner le projet**
   ```bash
   git clone https://github.com/PlinkkCorp/plinkk-backend.git
   cd plinkk-backend
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Générer la clé secrète de session** (si nécessaire)
   ```bash
   # Configurer un .env avec SESSION_KEY (ou SESSION_SECRET)
   ```

4. **Préparer la base de données & les permissions**
   ```bash
   pnpm prisma:dev
   # ou
   pnpm run prisma:init

   # Insérer les permissions par défaut dans la DB
   pnpm run seed-permissions
   ```

5. **Lancer les serveurs de développement (Dashboard + Public)**
   ```bash
   pnpm run launch-all
   ```
   *Ceci lance simultanément le port 3000 (Public) et 3001 (Dashboard) via concurrently.*

---

## 🔒 Variables d'environnement importantes

Un fichier `.env` à la racine est requis :

- `PORT_PUBLIC` / `PORT_DASHBOARD` : Ports des apps (ex: 3000 et 3001)
- `DATABASE_URL` : URI Postgres (prod) ou chemin fichier SQLite (dev: `file:./packages/prisma/prisma/dev.db`)
- `SESSION_SECRET` : Clé secrète pour chiffrer les cookies de session
- `RESEND_API_KEY` : Clé API Resend pour l'envoi d'emails (gratuit jusqu'à 3000 emails/mois)
- Les identifiants API externes (Stripe, Service Email dynamique, etc.)

## 📧 Service d'Email

Le backend utilise **Resend** pour l'envoi d'emails transactionnels depuis `noreply@plinkk.fr` :

- **Configuration** : Ajoutez `RESEND_API_KEY` dans votre `.env`
- **Documentation complète** : [docs/EMAIL_SERVICE.md](docs/EMAIL_SERVICE.md)
- **Tester le service** : `pnpm --filter @plinkk/dashboard test:email`

Fonctionnalités :
- Emails de bienvenue
- Confirmations de changement d'email
- Réinitialisation de mot de passe
- Notifications administrateur
- Templates HTML personnalisables

## 👮 Rôles & Permissions

Gérés via les modèles `Role`, `Permission`, et `RolePermission`. Pour ajouter de nouvelles permissions :
1. Définir la permission dans `packages/prisma/permissions.ts`.
2. Lancer `pnpm run seed-permissions`.
3. Assigner les permissions via l'interface `/admin/roles` sur le dashboard.

## 🤝 Dépannage rapide

- **Erreur `PrismaClient is not defined` :** Lancez `pnpm --filter @plinkk/prisma run generate` ou `pnpm install`.
- **Modifications CSS/Styles non appliquées :** Vérifiez que `packages/shared` n'est pas mis en cache, ou relancez `pnpm launch-all`.
- **L'iframe "Preview" affiche 404 :** Assurez-vous de charger la branche locale (http://127.0.0.1:3000) et non le domaine de prod, tel que configuré dans les variables d'environnement.

---

**Licence Custom by Plinkk** — © Plinkk
Voir le fichier `LICENSE` pour plus de détails.
