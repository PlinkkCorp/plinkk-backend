#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/dashboard/.env') });
const { PrismaClient } = require('../packages/prisma/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PATCH_NOTES = [
  {
    title: "Annonce Officielle",
    version: "1.0.0",
    publishedAt: new Date("2025-10-16"),
    content: `# Plinkk : La Nouvelle Génération de Liens Intelligents est Là ! ✨

Marre de partager une dizaine de liens différents ? 😩

Avec Plinkk, regroupez TOUT votre contenu en un seul endroit : moderne, élégant et 100% personnalisé.

## 💎 Ce que Plinkk vous offre :
- ✅ Design Pro pour une première impression réussie
- 🚀 Interface Intuitive pour une gestion sans effort
- 🛠️ Des Outils Puissants pour mettre votre univers en lumière

Que vous soyez Créateur, Développeur, Artiste ou Streamer, Plinkk est votre solution pour centraliser et briller en un clic.

👉 **Rejoignez la révolution dès aujourd'hui : https://plinkk.fr/**`,
  },
  {
    title: "Mise à Jour - Amélioration du Contrôle",
    version: "1.0.1",
    publishedAt: new Date("2025-10-16"),
    content: `# 🚀 Mise à Jour — 16 Octobre 2025

## ✨ Ajouts
- Boutons pour caché un élément de son plinkk plus facilement
- Catégorie "Agencement" qui permet de réarranger son plinkk
- "Dot" pour régler via interface le ° du dégradé
- Nouveau loader
- Modal de sélection des animations avec preview

## 🐛 Fixes
- Problèmes liés au \`-\` dans le slug
- Dégradé d'arrière-plan
- Agencement des couleurs d'arrière-plan

## ⚡ Optimisations
- Optimisation des requêtes API pour la BDD`,
  },
  {
    title: "MISE À JOUR MAJEURE",
    version: "2.0.0",
    publishedAt: new Date("2025-12-31"),
    content: `# 🚀 MISE À JOUR MAJEURE — 31 Décembre 2025

## ✨ Ajouts
- **DNS Manager** : Support des noms de domaine personnalisés
- **API Stats** : Génération de clé API pour exporter les statistiques
- **Export Local** : Possibilité de télécharger ses Plinkks
- **Multi-Plinkk** : Modularité page/sélecteur si plusieurs Plinkks sur un compte
- **Gestion** : Ajout des Sessions, des Cosmétiques et de l'agencement de profil
- **Catégories** : Organisation des liens par catégories
- **Aide** : Ajout du module \`?\` pour donner des infos contextuelles

## 🎨 UI / ERGONOMIE
- Refonte complète du Login, du Dashboard et de la Page de présentation
- Nouvelle interface pour la liste des utilisateurs
- Ergonomie d'édition retravaillée
- Refonte du module de gestion des Plinkks
- Ajout de presets pour les réseaux sociaux
- Nouvelles pages d'erreurs utilisateur

## 🐛 FIX & OPTIMISATIONS
- **Sécurité** : Correction de l'A2F (2FA)
- **Données** : Correction des statistiques (clics et previews)
- **Technique** : Optimisation globale des requêtes API et synchronisation Compte-Plinkk
- **Visuel** : Fix de l'affichage des photos de profil, de l'import d'image et de la barre de statut
- **Bugs divers** : Correction des animations, de l'ordonnancement des thèmes et des incohérences d'URL/slugs`,
  },
  {
    title: "PATCH NOTES - MISE À JOUR MAJEURE : PLINKK DASHBOARD",
    version: "2.1.0",
    publishedAt: new Date("2026-02-09"),
    content: `# 🚀 PATCH NOTES - MISE À JOUR MAJEURE : PLINKK DASHBOARD — 9 Février 2026

## 🌟 Nouveautés Premium & Fonctionnalités

- **Protection par mot de passe** : Sécurisez vos Plinkks avec un accès privé
- **Plinkks Programmés** : Définissez une date d'activation et d'expiration automatique pour vos liens
- **Cosmétiques Avancés** : Accès aux bannières animées (GIF), cadres personnalisés et effets visuels exclusifs
- *Note* : Certains effets visuels (Neon, Canva, Animations) sont désormais gratuits pour tout le monde !

## 💳 Intégration Stripe & Abonnements
- Mise en place du système de paiement Stripe
- Gestion simplifiée de votre abonnement, historique d'achat et facturation directement depuis le dashboard
- Alertes claires lorsque vous atteignez les limites de votre plan gratuit avec des options d'upgrade simplifiées

## 🔑 Authentification & Sécurité
- **Connexion Google** : Vous pouvez désormais lier votre compte Google pour une connexion en un clic !
- **Gestion des Identités** : Nouveau système pour empêcher de se bloquer hors de son compte
- **Refonte des Mots de Passe** : Processus de changement de mot de passe et de suppression de compte plus fluide et sécurisé

## 🛡️ Système de Rôles & Permissions (Overhaul)
- Nouveau système de permissions granulaires
- Amélioration de l'interface d'administration
- Centralisation du code via \`@plinkk/shared\`

## 🎨 Améliorations UI/UX
- **Interface Épurée** : Suppression des sections inutiles
- **Gestion des Liens** : Meilleure synchronisation entre le backend et le frontend
- **Support Shared Views** : Amélioration technique`,
  },
  {
    title: "Mise à jour - Exports et Analytics Premium",
    version: "2.1.1",
    publishedAt: new Date("2026-02-11"),
    content: `# 🚀 Mise à jour — 11 Février 2026

## ✨ Fonctionnalités Premium & Analytics
- **Exports de données** : Les utilisateurs Premium peuvent désormais exporter leurs statistiques au format CSV ou télécharger les graphiques en PNG
- **Analyses avancées** : Arrivée de l'onglet "Tendances détaillées" pour suivre l'évolution de vos liens avec précision
- **Gestion d'abonnement** : Intégration complète de Stripe pour l'annulation
- **Badge Premium** : Un nouveau badge fait son apparition sur les profils des membres concernés

## 🛡️ Administration & Modération (Outils Staff)
- **Nouveau Dashboard Admin** : Refonte complète
- **Système d'Impersonation** : Possibilité pour le staff de se connecter en tant qu'utilisateur
- **Broadcast & Annonces** : Nouvel outil pour diffuser des messages
- **Statistiques Plateforme** : Nouveaux graphiques en temps réel
- **Modération accrue** : Outils rapides pour bannir des emails

## 🛠️ Améliorations & Correctifs
- **Auth Google** : Meilleure gestion des variables d'environnement
- **Sécurité Proxy** : Optimisation de la détection des IPs clients
- **Légal** : Ajout de la page CGV
- **UI/UX** : Corrections de bugs d'affichage`,
  },
];

async function seed() {
  try {
    // Find an admin user to associate with patch notes
    let admin = await prisma.user.findFirst({
      where: { role: { name: "ADMIN" } },
    });

    if (!admin) {
      console.log("⚠️  No admin user found. Creating test admin...");
      admin = await prisma.user.create({
        data: {
          id: "plinkk-admin",
          userName: "klaynight",
          email: "admin@plinkk.fr",
          password: "hashed_password",
          name: "Klaynight",
          image: "https://avatars.githubusercontent.com/u/1234567?v=4",
        },
      });
    }

    console.log("🌱 Seeding patch notes...");

    for (const note of PATCH_NOTES) {
      const existing = await prisma.patchNote.findUnique({
        where: { version: note.version },
      });

      if (existing) {
        console.log(`✓ Patch note ${note.version} already exists, skipping...`);
        continue;
      }

      await prisma.patchNote.create({
        data: {
          title: note.title,
          version: note.version,
          content: note.content,
          publishedAt: note.publishedAt,
          isPublished: true,
          createdById: admin.id,
        },
      });

      console.log(`✓ Created patch note: ${note.version}`);
    }

    console.log("✅ Patch notes seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding patch notes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
