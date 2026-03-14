/**
 * Script de test pour publier un patch note sur Discord
 * 
 * Usage:
 * - Tester avec des données de demo: bun scripts/test-discord-webhook.js demo
 * - Tester avec un patch note existant: bun scripts/test-discord-webhook.js <patchnote-id>
 * - Lister les patch notes: bun scripts/test-discord-webhook.js list
 */

require("dotenv/config");

// Import conditionnel de Prisma (seulement si nécessaire)
let prisma = null;
const needsPrisma = process.argv.length > 2 && process.argv[2].toLowerCase() !== 'demo';

if (needsPrisma) {
  try {
    const { prisma: prismaClient } = require("@plinkk/prisma");
    prisma = prismaClient;
  } catch (error) {
    console.error("❌ Impossible de charger @plinkk/prisma");
    console.error("   Assurez-vous d'exécuter ce script depuis le workspace ou utilisez le mode demo");
    process.exit(1);
  }
}

/**
 * Envoie un message Discord avec un embed
 */
async function sendDiscordMessage(embed) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;

  if (!botToken || !channelId) {
    console.error('❌ Configuration manquante');
    console.error('Assurez-vous que DISCORD_BOT_TOKEN et DISCORD_ANNOUNCEMENT_CHANNEL_ID sont définis dans .env');
    return false;
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: "@everyone 🚀 Nouvelle mise à jour disponible !",
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur lors de l'envoi:", response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log("✅ Message envoyé avec succès ! ID:", data.id);

    // Tenter un crosspost si c'est un channel d'annonces
    try {
      const crosspostResponse = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${data.id}/crosspost`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      if (crosspostResponse.ok) {
        console.log("✅ Crosspost effectué pour les serveurs suiveurs");
      } else {
        console.log("ℹ️  Crosspost non disponible (channel non-annonces ou permission manquante)");
      }
    } catch (error) {
      // Ignorer les erreurs de crosspost
    }

    return true;
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    return false;
  }
}

/**
 * Extrait les sections du contenu markdown
 */
function extractSections(content) {
  const features = [];
  const fixes = [];
  const improvements = [];

  const lines = content.split("\n");
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes("nouvelles fonctionnalités") || 
        trimmed.toLowerCase().includes("nouveautés") ||
        trimmed.toLowerCase().includes("features")) {
      currentSection = "features";
      continue;
    } else if (trimmed.toLowerCase().includes("corrections") || 
               trimmed.toLowerCase().includes("bug fixes") ||
               trimmed.toLowerCase().includes("fixes")) {
      currentSection = "fixes";
      continue;
    } else if (trimmed.toLowerCase().includes("améliorations") || 
               trimmed.toLowerCase().includes("improvements")) {
      currentSection = "improvements";
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^\d+\./)) {
      const item = trimmed.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
      if (currentSection === "features") features.push(item);
      else if (currentSection === "fixes") fixes.push(item);
      else if (currentSection === "improvements") improvements.push(item);
    }
  }

  return { features, fixes, improvements };
}

/**
 * Crée un embed Discord à partir d'un patch note
 */
function createPatchNoteEmbed(patchNote) {
  const sections = extractSections(patchNote.content);
  const fields = [];

  if (sections.features.length > 0) {
    const featuresText = sections.features.slice(0, 5).map((f) => `• ${f}`).join("\n");
    fields.push({
      name: "✨ Nouvelles Fonctionnalités",
      value: featuresText.substring(0, 1024),
      inline: false,
    });
  }

  if (sections.improvements.length > 0) {
    const improvementsText = sections.improvements.slice(0, 5).map((i) => `• ${i}`).join("\n");
    fields.push({
      name: "🚀 Améliorations",
      value: improvementsText.substring(0, 1024),
      inline: false,
    });
  }

  if (sections.fixes.length > 0) {
    const fixesText = sections.fixes.slice(0, 5).map((f) => `• ${f}`).join("\n");
    fields.push({
      name: "🐛 Corrections",
      value: fixesText.substring(0, 1024),
      inline: false,
    });
  }

  if (fields.length === 0) {
    fields.push({
      name: "📋 Contenu",
      value: patchNote.content.substring(0, 1024),
      inline: false,
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || "https://plinkk.fr";
  const patchNoteUrl = `${frontendUrl}/patch-notes/${patchNote.version}`;

  fields.push({
    name: "\u200B",
    value: `🔗 **[Voir tous les détails sur le site](${patchNoteUrl})**`,
    inline: false,
  });

  return {
    title: `🎉 ${patchNote.title}`,
    description: `**Version ${patchNote.version}** vient d'être publiée !`,
    color: 0x7c3aed,
    url: patchNoteUrl,
    timestamp: new Date().toISOString(),
    footer: {
      text: "Déployé avec ❤️ par l'équipe Plinkk",
      icon_url: "https://plinkk.fr/images/logo.png",
    },
    thumbnail: {
      url: "https://plinkk.fr/images/logo.png",
    },
    author: patchNote.createdBy?.name
      ? {
          name: patchNote.createdBy.name,
          icon_url: patchNote.createdBy.image || undefined,
        }
      : undefined,
    fields,
  };
}

async function testWithExistingPatchNote(patchNoteId) {
  if (!prisma) {
    console.error("❌ Prisma non disponible. Utilisez le mode demo: bun scripts/test-discord-webhook.js demo");
    return false;
  }

  console.log(`\n🔍 Recherche du patch note ${patchNoteId}...\n`);
  
  const patchNote = await prisma.patchNote.findUnique({
    where: { id: patchNoteId },
    include: { 
      createdBy: { 
        select: { id: true, name: true, image: true } 
      } 
    },
  });

  if (!patchNote) {
    console.error(`❌ Patch note ${patchNoteId} introuvable`);
    return false;
  }

  console.log(`✅ Patch note trouvé: ${patchNote.title} (v${patchNote.version})`);
  console.log(`📅 Publié le: ${patchNote.publishedAt || 'Non publié'}`);
  console.log(`\n📤 Publication sur Discord...\n`);

  const embed = createPatchNoteEmbed(patchNote);
  return await sendDiscordMessage(embed);
}

async function testWithDemoData() {
  console.log(`\n📝 Test avec des données de démonstration...\n`);

  const demoPatchNote = {
    id: 'demo-' + Date.now(),
    title: '🎉 Mise à jour majeure v2.5.0',
    version: '2.5.0',
    content: `
## ✨ Nouvelles Fonctionnalités

- Nouveau système de thèmes personnalisables
- Intégration des statistiques avancées
- Export des données en PDF
- Mode sombre amélioré

## 🚀 Améliorations

- Performance de chargement optimisée (+40%)
- Interface utilisateur redessinée
- Meilleure compatibilité mobile
- Mise en cache améliorée

## 🐛 Corrections

- Correction du bug d'affichage des avatars
- Résolution des problèmes de session
- Correction de l'export CSV
- Fix des notifications en temps réel
    `,
    isPublished: true,
    publishedAt: new Date(),
    createdById: 'demo-user',
    createdBy: {
      name: 'Équipe Plinkk',
      image: 'https://plinkk.fr/images/logo.png',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log(`✅ Patch note demo créé: ${demoPatchNote.title}`);
  console.log(`\n📤 Publication sur Discord...\n`);

  if (!prisma) {
    console.error("❌ Prisma non disponible pour lister les patch notes");
    return;
  }

  const embed = createPatchNoteEmbed(demoPatchNote);
  return await sendDiscordMessage(embed);
}

async function listRecentPatchNotes() {
  console.log('\n📋 Derniers patch notes disponibles:\n');
  
  const patchNotes = await prisma.patchNote.findMany({
    take: 10,
    orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
    select: {
      id: true,
      title: true,
      version: true,
      isPublished: true,
      publishedAt: true,
    },
  });

  if (patchNotes.length === 0) {
    console.log('❌ Aucun patch note trouvé dans la base de données');
    return;
  }

  patchNotes.forEach((pn, index) => {
    const status = pn.isPublished ? '✅ Publié' : '📝 Brouillon';
    const date = pn.publishedAt ? new Date(pn.publishedAt).toLocaleDateString('fr-FR') : 'N/A';
    console.log(`${index + 1}. ${status} - v${pn.version} - ${pn.title}`);
    console.log(`   ID: ${pn.id} - Date: ${date}\n`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   🤖 Test de publication Discord - Patch Notes');
  console.log('═══════════════════════════════════════════════════════');

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;

  console.log('\n⚙️  Configuration Discord Bot:');
  console.log(`   Bot Token: ${botToken ? '✅ Configuré' : '❌ Non configuré'}`);
  console.log(`   Channel ID: ${channelId ? '✅ Configuré' : '❌ Non configuré'}`);

  if (!botToken || !channelId) {
    console.log('\n⚠️  ATTENTION: Configuration Discord Bot incomplète !');
    console.log('   Configurez les variables suivantes dans le fichier .env:');
    console.log('\n   DISCORD_BOT_TOKEN="votre_token_bot_ici"');
    console.log('   DISCORD_ANNOUNCEMENT_CHANNEL_ID="id_du_channel_ici"\n');
    process.exit(1);
  }demo            # Tester avec des données de demo (recommandé)');
    console.log('   bun scripts/test-discord-webhook.js <patchnote-id>  # Tester avec un patch note existant');
    console.log('   bun scripts/test-discord-webhook.js list            # Lister les patch notes\n');
  } else if (args[0].toLowerCase() === 'demo') {
    await testWithDemoData();
  } else {
    const patchNoteId = args[0];
    await testWithExistingPatchNote(patchNoteId);
  }

  if (prisma) {
    await prisma.$disconnect();
  }
    const patchNoteId = args[0];
    await testWithExistingPatchNote(patchNoteId);
  }

  await prisma.$disconnect();
  console.log('\n═══════════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
