/**
 * Script de seed pour les templates d'emails système
 * Crée des templates prédéfinis pour faciliter l'envoi d'emails
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/dashboard/.env') });
const { PrismaClient } = require('../packages/prisma/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SYSTEM_TEMPLATES = [
  {
    name: "Nouvelle fonctionnalité",
    subject: "🎉 Nouvelle fonctionnalité disponible !",
    title: "Découvrez notre dernière nouveauté",
    message: "Nous sommes ravis de vous annoncer l'ajout d'une nouvelle fonctionnalité sur Plinkk. Cette amélioration va vous permettre de...",
    actionText: "Découvrir maintenant",
    actionUrl: "https://dash.plinkk.fr/dashboard",
    category: "feature",
    isSystem: true,
  },
  {
    name: "Mise à jour importante",
    subject: "📢 Mise à jour Plinkk",
    title: "Améliorations et corrections",
    message: "Nous avons déployé une mise à jour importante incluant plusieurs améliorations de performances et corrections de bugs. Consultez les notes de version pour tous les détails.",
    actionText: "Voir les notes",
    actionUrl: "https://dash.plinkk.fr/patchnotes",
    category: "update",
    isSystem: true,
  },
  {
    name: "Alerte sécurité",
    subject: "🔒 Action requise : Sécurité de votre compte",
    title: "Action de sécurité détectée",
    message: "Nous avons détecté une activité inhabituelle sur votre compte. Par mesure de précaution, nous vous recommandons de vérifier vos paramètres de sécurité et de changer votre mot de passe si nécessaire.",
    actionText: "Vérifier mon compte",
    actionUrl: "https://dash.plinkk.fr/settings",
    category: "security",
    isSystem: true,
  },
  {
    name: "Annonce générale",
    subject: "📣 Annonce importante",
    title: "Une annonce de l'équipe Plinkk",
    message: "Nous avons une annonce importante à partager avec tous nos utilisateurs. [Modifiez ce message selon vos besoins]",
    actionText: "En savoir plus",
    actionUrl: "https://plinkk.fr",
    category: "announcement",
    isSystem: true,
  },
  {
    name: "Offre Premium",
    subject: "✨ Passez à Plinkk Premium",
    title: "Débloquez toutes les fonctionnalités",
    message: "Passez à Plinkk Premium pour accéder à des thèmes exclusifs, des analytics avancées, des pages illimitées et bien plus encore !",
    actionText: "Découvrir Premium",
    actionUrl: "https://dash.plinkk.fr/premium",
    category: "announcement",
    isSystem: true,
  },
  {
    name: "Enquête utilisateur",
    subject: "💬 Votre avis compte !",
    title: "Aidez-nous à améliorer Plinkk",
    message: "Nous aimerions connaître votre avis sur Plinkk. Prenez quelques minutes pour répondre à notre enquête et aidez-nous à améliorer nos services.",
    actionText: "Répondre à l'enquête",
    actionUrl: "https://plinkk.fr/feedback",
    category: "other",
    isSystem: true,
  },
];

async function main() {
  console.log("🌱 Seed des templates d'emails système...\n");

  let created = 0;
  let skipped = 0;

  for (const template of SYSTEM_TEMPLATES) {
    try {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`⏭️  Template "${template.name}" existe déjà`);
        skipped++;
        continue;
      }

      await prisma.emailTemplate.create({
        data: template,
      });

      console.log(`✅ Template "${template.name}" créé`);
      created++;
    } catch (error) {
      console.error(`❌ Erreur pour "${template.name}":`, error.message);
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   - ${created} templates créés`);
  console.log(`   - ${skipped} templates existants ignorés`);
  console.log(`\n✨ Seed terminé avec succès !`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
