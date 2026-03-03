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
  {
    title: "CHANGELOG - Mise à jour Cumulative",
    version: "2.1.2",
    publishedAt: new Date("2026-02-13 14:18"),
    content: `# 🚀 CHANGELOG - Mise à jour Cumulative - 13 Février 2026

## ✨ Nouveautés & UI/UX
- **Skeleton Loading** : Implémentation globale de skeleton screens et lazy-loading des images pour améliorer le LCP (Largest Contentful Paint)
- **Dashboard Summary** : Nouvel endpoint \`/api/me/dashboard-summary\` pour peupler les stats et liens récents de manière asynchrone
- **Icon Picker Overhaul** : Refonte du sélecteur (onglets Library/Uploads/Gravatar), support des URLs complètes et meilleure UX pour l'upload

## 💳 Billing & Stripe
- **Lifetime Plans** : Support backend et frontend pour les plans \`premium_lifetime\`
- **Sync Stripe** : Gestion améliorée des webhooks (\`subscription.updated\`, \`deleted\`) et distinction stricte entre source \`STRIPE\` et \`MANUAL\`

## 🔒 Sécurité & Admin
- **User Audit Logs** : Nouveau système de logs (Prisma UserLog) traçant toutes les actions critiques (Auth, API keys, Profile updates)
- **Admin View** : Nouvelle UI pour inspecter les logs, avec filtrage par \`targetId\`, avatars des utilisateurs concernés et traduction FR
- **Session Hardening** : Normalisation des données de session (fix des crashs object vs string) et typage S3 renforcé
- **Gravatar** : Passage à SHA-256 et sélecteur de source (Primary vs Public email)

## 🐛 Correctifs Divers
- Correction des index Z sur les boutons
- Typage TypeScript (S3 Client)
- Gestion des erreurs Stripe améliorée`,
  },
  {
    title: "CHANGELOG - Backend & Frontend Fixes",
    version: "2.1.3",
    publishedAt: new Date("2026-02-13 14:18"),
    content: `# 🛠️ CHANGELOG - Backend & Frontend Fixes - 13 Février 2026

## 🔒 Security & Access Control
- **User Ban Logic** : Middleware pour vérifier le statut \`bannedEmail\` et redirection vers une page d'erreur dédiée si l'utilisateur est banni
- **Password Protected Plinkks** : Gestion des sessions pour les pages verrouillées (stockage de la clé de déverrouillage en session)

## 📈 Analytics & DB
- **Daily Views Aggregation** : Implémentation du modèle \`UserViewDaily\` avec upsert pour incrémenter les vues de manière atomique
- **Error Handling** : Logs d'erreurs enrichis (objet complet) lors des échecs SQLite sur \`user.updateMany\` ou upsert

## 🖼️ Assets & Rendering
- **Canvas Fallback** : Si le module local canvas n'est pas disponible (problème Node.js/OS), le serveur renvoie désormais une image distante S3 (\`plinkk-image/default_profile.png\`) au lieu de crasher
- **Asset Cleanup** : Suppression automatique des références aux images d'avatars supprimées

## 🔧 Core & Config
- **Dynamic Frontend URL** : Injection de \`window.__PLINKK_FRONTEND_URL__\` via \`head.ejs\` pour une configuration plus flexible des environnements
- **Prisma Build** : Ajout de \`@prisma/engines\` et \`prisma\` dans \`onlyBuiltDependencies\` (pnpm) pour assurer un build correct dans le workspace

## 👮 Admin Dashboard
- **Logs Filtering** : Support backend et frontend pour le filtrage par \`targetId\` dans les logs d'audit. Validation des dates améliorée`,
  },
  {
    title: "MISE À JOUR SYSTÈME - Audit & Versioning",
    version: "2.1.4",
    publishedAt: new Date("2026-02-14 00:56"),
    content: `# 🛠️ MISE À JOUR SYSTÈME - 14 Février 2026

Une énorme vague de refactorisation et de nouvelles fonctionnalités a été déployée ! L'accent a été mis sur la sécurité, la traçabilité et l'expérience administrateur.

## 🛡️ Système d'Audit & Logs (User & Admin)
- **Audit Détaillé** : Introduction de \`logDetailedAction\` avec calcul de diffs (avant/après). Vous pouvez désormais voir exactement quel champ a été modifié
- **Nouvel Onglet Logs** : Interface repensée dans l'admin avec filtres par \`targetId\`, dates et catégories
- **Persistance d'affichage** : Les onglets de logs sont désormais synchronisés avec l'URL (hash), permettant de partager un lien direct vers un log spécifique
- **Enrichissement des données** : Les logs affichent désormais les avatars, des aperçus compacts des changements cosmétiques et une section "Raw Data" rétractable

## 🎨 Thèmes & Personnalisation
- **Nouveau Bouton "Web"** : Ajout d'un thème exclusif avec son icône dédiée et ses styles CSS
- **Gestion centralisée** : Création de \`themeNames.ts\` pour uniformiser les couleurs à travers toute l'application
- **Aperçus dynamiques** : Les changements de thèmes génèrent maintenant des previews visuelles directement dans les logs d'activité

## 🛠️ Refonte de l'Administration
- **User Management 2.0** : Nouveau modal ultra-complet incluant :
  - Vue d'ensemble : Rôles, badges, et status 2FA
  - Modération : Formulaire de bannissement, réinitialisation de mot de passe forcée
  - Sécurité : Désactivation du 2FA et gestion des sessions
- **Impersonnalisation** : Outil amélioré pour tester l'expérience utilisateur directement depuis l'admin
- **Performance** : Refactorisation complète des routes admin utilisant les types Prisma natifs et une extraction sécurisée de l'adminId

## 📦 Export & Outils
- **Export Avancé** : Nouvelle modal d'exportation de Plinkks avec options granulaires (inclure images, icônes, ou Canva)
- **Refonte styleTools** : Consolidation de la logique de rendu (DOM, animations, easter eggs) dans des modules isolés et plus robustes
- **Validation accrue** : Meilleure gestion des erreurs sur les URLs, couleurs et fallbacks d'images

## 📝 Détails techniques
- **Backend** : Mise à jour de la dépendance \`pg\` vers \`^8.18.0\`
- **Prisma** : Nettoyage des fichiers générés et typage strict \`InputJsonObject\` pour les métadonnées
- **Localisation** : Amélioration des labels français dans l'interface de gestion`,
  },
  {
    title: "MISE À JOUR SYSTÈME - Versioning & TypeScript",
    version: "2.1.5",
    publishedAt: new Date("2026-02-14 02:27"),
    content: `# 🛠️ MISE À JOUR SYSTÈME - PARTIE 2 - 14 Février 2026

Le déploiement continue avec l'arrivée d'une fonctionnalité majeure : le versioning, accompagnée d'un renforcement massif du code (TypeScript) et d'une interface plus ergonomique.

## ⏳ Système de Versions & Historique (Nouveau !)
- **Snapshots Automatiques** : Le système capture désormais l'état de vos Plinkks lors des modifications importantes (config, réglages, CRUD)
- **Restauration en un clic** : Nouvelle page Historique permettant de prévisualiser et de restaurer une version précédente en cas d'erreur
- **Gestion Intelligente** : Mise en place de limites de rétention pour les utilisateurs gratuits et d'un système de "cooldown" pour éviter de surcharger la base de données
- **Service Dédié** : Création du \`plinkkHistoryService\` pour gérer toute la logique de sauvegarde et de récupération

## 📂 Refonte de l'Interface Dashboard
- **Barre Latérale (Sidebar)** : Nettoyage complet du fichier \`asside_dash.ejs\`. Navigation restructurée, ajout d'un lien direct vers l'Historique et amélioration de l'affichage du profil
- **Éditeur Épuré** : Suppression de la section d'historique "inline" dans l'éditeur pour une expérience de modification plus fluide, redirigeant désormais vers la page dédiée
- **Correctifs UI** : Réparation des chemins SVG dans la vue édition et optimisation de l'affichage des badges de compteurs

## 🛡️ Type-Safety & Robustesse (TypeScript)
- **Zéro "Any"** : Refactorisation majeure pour imposer des types stricts à travers tout le projet (Dashboard & Prisma)
- **Sessions Sécurisées** : Meilleure gestion des interfaces \`SessionData\` et \`FastifyRequest\` pour garantir que l'ID utilisateur est toujours correctement récupéré et casté
- **Validation des Logs** : Les filtres de dates et les métadonnées de logs sont désormais strictement typés pour éviter les crashs à l'exécution
- **Prisma & JSON** : Utilisation systématique de \`Prisma.InputJsonObject\` pour la gestion des thèmes et des configurations complexes

## ⚙️ Optimisation de la Base de Données
- **Simplification Prisma** : Suppression de l'adaptateur PG personnalisé au profit de l'instanciation directe de \`PrismaClient\`. Cela simplifie l'initialisation et résout certains problèmes de drivers lors du nettoyage de l'environnement
- **Scripts Dev** : Passage à \`tsx watch\` pour les scripts de développement afin d'accélérer le workflow de l'équipe`,
  },
  {
    title: "SYSTEM UPDATE - Historique et Versioning",
    version: "2.2.0",
    publishedAt: new Date("2026-02-15"),
    content: `# 🚀 SYSTEM UPDATE - 15 Février 2026

## 🌟 LES PLUS (Nouveautés)
+ HISTORIQUE : Système de snapshots automatiques pour restaurer vos Plinkks à tout moment.
+ MIGRATION CDN : Chargement ultra-rapide des assets via cdn.plinkk.fr.
+ USER MANAGEMENT : Nouveau dashboard admin complet (Overview, Sécurité, Ban/Unban).
+ VERSIONS : Page dédiée pour prévisualiser et comparer vos anciennes modifications.
+ THEME WEB : Ajout d'un tout nouveau style de bouton "Web" avec icône dédiée.
+ EXPORT PRO : Exportation ZIP granulaire (images, icônes, Canva).

## 🛠️ LES CHANGEMENTS (Refactor & Fixes)
-> TOUCH HANDLING : Le Drag-and-Drop est désormais 100% fonctionnel sur mobile (fix touch-action).
-> ICON INVERSION : Les icônes s'adaptent (noir/blanc) automatiquement selon votre thème.
-> AVATARS : Augmentation de la taille de profil (160px -> 180px) pour un meilleur rendu.
-> PROFILE ICON : Augmentation de la taille de l'icône de profil (18px -> 100px) pour une vision et une ergonomie améliorée.
-> AUDIT LOGS : Tracé ultra-détaillé des actions (diffs avant/après) pour la modération.
-> TYPESCRIPT : Renforcement global du code pour 0 erreur en production.
-> PRISMA : Optimisation de la connexion DB et de l'adaptateur Postgres.

## ⚠️ LES MOINS (Retraits & Nettoyage)
- Suppression du champ obsolète "buttonTheme" dans l'API pour plus de légèreté.
- Retrait de l'onglet historique "inline" (désormais centralisé dans la sidebar).
- Nettoyage des imports doublons et des fichiers générés inutiles.

💡 Le petit conseil
Si vos icônes ne s'affichent pas correctement, faites un petit CTRL + F5 pour forcer la mise à jour du cache CDN !`,
  },
  {
    title: "SYSTEM UPDATE - Maintenance & UI Refactor",
    version: "2.2.1",
    publishedAt: new Date("2026-02-16"),
    content: `# 🛠️ SYSTEM UPDATE - MAINTENANCE & UI REFACTOR - 16 Février 2026

## 🌟 LES PLUS (Nouveautés)
+ MAINTENANCE MODE : Nouveau système complet pilotable depuis l'admin (Schedule, Raison, IPs autorisées).
+ ALLOWLIST vs BLOCKLIST : Gestion granulaire des pages en maintenance (maintenancePages).
+ DASHBOARD UI : Refonte visuelle du gestionnaire de maintenance (style explorateur de fichiers).
+ ERROR PAGES 2.0 : Design moderne pour les pages 404, 500, et 503 avec animations et mode debug.
+ DISCORD : Mise à jour du lien d'invitation officiel dans tout le site (cN4dyPxbXZ).

## 🛠️ LES CHANGEMENTS (Refactor & Fixes)
-> PRISMA CONFIG : Centralisation de la configuration Prisma et de la DB_URL dans prisma.config.ts.
-> CSS EXTERNE : Déplacement des styles de la Landing Page vers landing.css pour un meilleur cache.
-> ERROR PARTIALS : Extraction du code des pages d'erreurs en partials pour éviter la duplication.
-> PREHANDLER HOOK : Nouveau middleware serveur pour bloquer l'accès selon le statut de maintenance.
-> UI TWEAKS : Amélioration visuelle des checkboxes admin (Emerald/Red states) et suppression du focus ring.

## ⚠️ LES MOINS (Retraits & Nettoyage)
- Nettoyage des styles inline massifs dans les fichiers EJS (Landing et Erreurs).
- Suppression des anciennes logiques de redirection manuelle pour la maintenance.
- Retrait des doublons de déclaration de DATABASE_URL dans le schéma Prisma.

📢 Note importante
Le nouveau système de maintenance permet désormais d'exclure certains rôles (Admin/Staff) ou certaines adresses IP pour qu'ils puissent continuer à naviguer sur le site pendant les travaux !`,
  },
  {
    title: "MEGA UPDATE — VERSION 2.5.0 : LEADS & SMART THEMES",
    version: "2.3.0",
    publishedAt: new Date("2026-02-25"),
    content: `# 🚀 MEGA UPDATE — VERSION 2.5.0 : LEADS, SMART THEMES & MODULAR UI - 25 Février 2026

## 🌟 LES PLUS (Nouveautés majeures)
+ LEADS MANAGER : Page dédiée pour collecter et gérer vos prospects. Export CSV, filtres et recherche intégrés.
+ LIENS TYPES : Support des formats HEADER (titres), EMBED (intégration dynamique) et FORM (formulaires de contact).
+ SMART EMBEDS : Intégration optimisée pour YouTube, Spotify, Twitch, Calendly, Typeform, etc.
+ FORMULAIRES : Composant ultra-complet avec validations, animations et mode succès auto-fermant.
+ BUG REPORTS : Système de signalement intégré avec dashboard admin pour la résolution des tickets.
+ LIVE SYNC : Synchronisation instantanée de l'iframe de preview (plus besoin de recharger).
+ SMART INVERSION : Les icônes s'adaptent dynamiquement à la luminosité du thème (clair/sombre).
+ ICON UPLOAD : Support pour uploader vos propres icônes ou utiliser des URLs externes.
+ GRADIENTS AVANCÉS : Support multi-stops pour les dégradés avec sélecteur d'angle et de couleurs.
+ BADGES : Affichage des badges "Vérifié" et "Partenaire" sur les profils.

## 🛠️ LES CHANGEMENTS (Refactor & Fixes)
-> MODULAR UI : Refonte du dashboard en modules (LinkManager, CategoryManager, SettingsManager).
-> THEME ENGINE : Le système détecte le fond (isLightTheme) pour ajuster les contrastes et les couleurs root.
-> SMART ORDERING : Introduction du champ 'index' pour un tri manuel ultra-précis des liens.
-> ICON PICKER PRO : Interface améliorée avec prévisualisation Gravatar et grille d'uploads avec skeletons.
-> STATS GRANULARITÉ : Historique des clics/vues disponible par jour/heure/minute.
-> TOUCH HANDLING : Drag-and-Drop 100% fonctionnel sur mobile (fix touch-action).
-> MIGRATION CDN : Chargement ultra-rapide des assets via cdn.plinkk.fr.
-> SIGNUP UX : Auto-génération du username, indicateur de mot de passe et pré-remplissage d'email.

## ⚠️ LES MOINS (Retraits & Nettoyage)
- BENTO GRID : Retrait de la fonctionnalité de grille Bento pour simplifier l'expérience utilisateur.
- STATUSBAR : Fusion du bloc statusbar directement dans le profil utilisateur.
- CLEANUP : Suppression des styles inline, des logs console de debug et des vieux fichiers de backup.
- ACCÈS : La vue du tunnel d'acquisition (Funnel) est désormais réservée aux membres Premium.

📦 Détails Techniques & Infrastructure
Asset Pipeline : Les icônes jsDelivr sont désormais traitées séparément (.icon-black-source) pour garantir une netteté maximale.
Prisma & DB : Mise à jour du schéma pour supporter les gradients, les leads et les funnelEvents.
DevOps : Intégration de Husky et lint-staged pour l'auto-incrément des versions.
Sécurité : Renforcement de la Content-Security-Policy (CSP) pour les embeds YouTube/Vimeo.

💡 Astuce de l'équipe
Vous pouvez désormais forcer l'ouverture de vos liens directement dans les applications natives (Instagram, TikTok, YouTube) !`,
  },
  {
    title: "STATS 2.0, BUG TRACKER & PRICING REDESIGN",
    version: "2.3.1",
    publishedAt: new Date("2026-02-25"),
    content: `# 📊 STATS 2.0, BUG TRACKER & PRICING REDESIGN - 25 Février 2026

## 🌟 LES PLUS (Nouveautés)
+ PER-PLINKK STATS : Visualisez désormais les vues et clics individuellement pour chaque lien (via plinkkViewDaily).
+ AUTO-GRANULARITÉ : Le système ajuste automatiquement l'échelle du graphique (seconde, minute, heure, jour) selon la période sélectionnée.
+ BUG REPORTS : Système complet de signalement de bugs avec interface admin pour répondre et résoudre les tickets.
+ PRICING REBORN : Nouveau design de la table comparative (effet glassy, typographie moderne et mise en avant du pack Premium).
+ CHART CROSSHAIR : Ajout d'un guide vertical (crosshair) sur les graphiques pour une lecture précise des données au survol.

## 🛠️ LES CHANGEMENTS (Refactor & Fixes)
-> DEV ROUTES : Ouverture des routes publiques sur les hôtes de développement (/, /pricing, /about, etc.).
-> STATS UI : Nouveau menu de sélection de plage (7, 14, 30, 90 jours) et mise à jour dynamique des cartes de résumé.
-> COSMETICS V2 : Refonte de la vue cosmétique avec onglets (Thème, Décoration, Bannière) et preview en temps réel.
-> BADGES : Finalisation des styles CSS pour les badges "Vérifié" et "Partenaire".
-> HOST LOOKUP : Amélioration de la résolution des slugs sur les environnements de dev avant le fallback hôte.

## ⚠️ LES MOINS (Retraits & Nettoyage)
- Suppression des notes de tracking redondantes dans la vue admin.
- Nettoyage des styles inline dans le composant de comparaison de prix.
- Correction des fermetures de blocs CSS mal terminés dans les fichiers de badges.

📈 Zoom sur les Statistiques
Le nouveau sélecteur de granularité vous permet de descendre jusqu'à la seconde pour analyser vos pics de trafic en temps réel. Les graphiques intègrent désormais le mode intersect: false, affichant les informations de tous les jeux de données !`,
  },
  {
    title: "SYSTEM UPDATE - GEMS, PASSWORDS & PARTNERS",
    version: "2.4.0",
    publishedAt: new Date("2026-03-02"),
    content: `# 💎 SYSTEM UPDATE - GEMS, PASSWORDS & PARTNERS - 2 Mars 2026

## 🌟 LES PLUS (Nouveautés)
+ GEMS & QUÊTES : Nouveau système économique. Gagnez des Gems en complétant des quêtes partenaires.
+ FORGOT PASSWORD : Flux complet de récupération de compte par email (Token 32-bytes, expiration 1h).
+ ADMIN PASSWORD : Les admins peuvent désormais réinitialiser le mot de passe d'un utilisateur depuis le modal.
+ PARTNERS DASHBOARD : Pages dédiées aux statistiques partenaires (Vues, Clics, Gems générés).
+ GITHUB CARDS : Affichage dynamique des stars/forks du repo Plinkk sur la page "À propos".
+ PCL LICENSE : Introduction de la "Plinkk Communautary Licence" (PCL) pour l'open-source.

## 🛠️ LES CHANGEMENTS (Refactor & Fixes)
-> TOAST API : Migration vers une API typée ("error"/"success") pour des notifications plus stables.
-> MOBILE MENU : Réorganisation par sections ("Général" & "Personnalisation") pour une meilleure ergonomie.
-> AFFILIATE REDIRECT : Les liens d'affiliation redirigent désormais directement vers la racine (/).
-> DISCORD LINK : Mise à jour de l'invitation officielle vers le nouveau serveur (SJRx86UFWe).
-> UI FIXES : Correction des accents/typos FR et ajustement des z-index pour les modales et toasts.
-> ASSET MGMT : Utilisation de Sharp + S3 pour l'upload d'images partenaires.

## ⚠️ LES MOINS (Retraits & Nettoyage)
- Suppression de l'ancien système de toast local non-typé.
- Retrait de la recherche utilisateur inutile lors des redirections d'affiliation.
- Nettoyage des anciennes licences MIT au profit de la licence PCL.
- Suppression de l'entrée "Premium" redondante dans le menu mobile.

📢 Note importante
Sécurité : La récupération de mot de passe utilise désormais un système de "Magic Links" sécurisé. Pour éviter l'énumération d'emails, le site affichera toujours un message de succès, même si l'email n'existe pas.`,
  },
];

async function seed() {
  try {
    // Find or create Plinkk Team user for patch notes
    let admin = await prisma.user.findFirst({
      where: { userName: "plinkk-team" },
    });

    if (!admin) {
      console.log("⚠️  Utilisateur 'Plinkk Team' non trouvé. Recherche d'un admin...");
      admin = await prisma.user.findFirst({
        where: { role: { name: "ADMIN" } },
      });
    }

    if (!admin) {
      console.log("⚠️  Aucun admin trouvé. Création de Plinkk Team...");
      
      // Générer un ID simple (16 caractères alphanumériques)
      const generateId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 16; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      };
      
      const adminRole = await prisma.role.findFirst({
        where: { name: "ADMIN" },
      });
      
      admin = await prisma.user.create({
        data: {
          id: generateId(),
          userName: "plinkk-team",
          email: "team@plinkk.fr",
          password: "$2b$10$dummy.hash.value.for.system.account",
          name: "Plinkk Team",
          image: "https://cdn.plinkk.fr/logo.svg",
          hasPassword: false,
          emailVerified: true,
          roleId: adminRole?.id,
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
