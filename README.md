# Plinkk Backend

Backend Node.js/TypeScript pour le projet [Plinkk](https://github.com/Klaynight-dev/plinkk), une alternative moderne à Linktree.

## 🚀 Fonctionnalités

- Authentification (inscription, connexion, session sécurisée)
- Génération dynamique de profils utilisateurs
- API pour servir les assets, images, fichiers JS/CSS personnalisés
- Intégration avec Prisma (SQLite)
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
   git clone https://github.com/Marvideo2009/plinkk-backend.git
   cd plinkk-backend
   ```

2. **Installer les dépendances**

  ```bash
  pnpm install
  # ou npm install
  ```

3. **Générer la clé de session**

  ```bash
  pnpm run create-key
  ```

4. **Configurer la base de données**

  ```bash
  pnpx prisma migrate deploy
  ```

5. **Lancer en développement**

  ```bash
  pnpm run dev
  # Accès sur http://localhost:3000
  ```

## 🛠️ Scripts utiles

- `pnpm run dev` : Démarre le serveur en mode développement (hot reload)
- `pnpm run build` : Compile le projet TypeScript et copie les assets
- `pnpm run start` : Lance le serveur compilé (production)
- pnpm run create-key : Génère une clé secrète pour les sessions

## 📁 Structure

- `src/server.ts` : Point d'entrée principal (Fastify)
- `src/views/` : Templates EJS
- `src/public/` : Fichiers statiques (JS, CSS, images)
- `generated/prisma/` : Client Prisma généré
- `prisma/schema.prisma` : Schéma de la base de données

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Sessions sécurisées via fastify-secure-session
- Validation des entrées utilisateurs avec Zod

## 📚 Liens utiles

- Frontend Plinkk : [github.com/Klaynight-dev/plinkk](https://github.com/Klaynight-dev/plinkk)
- Documentation Plinkk : [github.com/Klaynight-dev/plinkk/docs.md](https://github.com/Klaynight-dev/plinkk/blob/main/.md/docs.md)

## 📝 Licence

MIT © Marvideo2009, Klaynight [LICENSE](LICENSE)
