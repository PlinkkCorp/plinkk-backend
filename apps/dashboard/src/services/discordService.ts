import { PatchNote } from "@plinkk/prisma";

// Suppression de l'interface DiscordConfig (plus utilisée)
interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  url?: string;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

/**
 * Service pour publier des annonces sur Discord via un bot
 * Le bot peut publier dans les channels d'annonces et faire un crosspost automatique
 * vers les serveurs suiveurs
 */
class DiscordService {
  private botToken: string | undefined;
  private channelId: string | undefined;
  private initDisabled = false;

  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN;
    this.channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
  }

  /**
   * Vérifie si le service Discord est configuré
   */
  isConfigured(): boolean {
    return !!(this.botToken && this.channelId);
  }

  /**
   * Initialise le service Discord et vérifie la connexion au démarrage
   */
  async initialize(): Promise<void> {
    if (this.initDisabled) {
      return;
    }

    if (!this.isConfigured()) {
      console.log("[Discord] ⚠️  Service Discord non configuré");
      console.log("[Discord] Configurez DISCORD_BOT_TOKEN et DISCORD_ANNOUNCEMENT_CHANNEL_ID pour activer les annonces automatiques");
      return;
    }

    console.log("[Discord] 🔧 Initialisation du service Discord...");

    try {
      const timeoutMs = Number(process.env.DISCORD_INIT_TIMEOUT_MS || 4000);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Vérifier que le bot peut accéder au channel
      const response = await fetch(`https://discord.com/api/v10/channels/${this.channelId}`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Authorization: `Bot ${this.botToken}`,
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("[Discord] ⚠️ Impossible d'accéder au channel:", response.status, errorText);
        console.warn("[Discord] Vérifiez que le bot a les permissions nécessaires et que l'ID du channel est correct");
        return;
      }

      const channelData = await response.json();
      console.log(`[Discord] ✅ Bot connecté avec succès !`);
      console.log(`[Discord] 📢 Channel cible: #${channelData.name} (${channelData.type === 5 ? "Annonces" : "Texte"})`);
      
      if (channelData.type === 5) {
        console.log("[Discord] 🌐 Crosspost activé pour les serveurs suiveurs");
      } else {
        console.log("[Discord] ℹ️  Pour activer le crosspost, utilisez un channel d'annonces");
      }
    } catch (error: any) {
      const code = error?.code || error?.cause?.code;
      if (code === "UND_ERR_CONNECT_TIMEOUT" || error?.name === "AbortError") {
        console.warn("[Discord] ⚠️ Timeout réseau pendant l'initialisation. Service Discord désactivé pour cette session.");
      } else {
        console.warn("[Discord] ⚠️ Erreur lors de l'initialisation:", error?.message || String(error));
      }
      this.initDisabled = true;
      console.warn("[Discord] Le service Discord est désactivé jusqu'au prochain redémarrage.");
    }
  }

  /**
   * Raccourcit le contenu markdown pour l'affichage Discord
   */
  private truncateContent(content: string, maxLength: number = 1024): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + "...";
  }

  /**
   * Extrait les sections principales du contenu markdown
   */
  private extractSections(content: string): { features: string[]; fixes: string[]; improvements: string[] } {
    const features: string[] = [];
    const fixes: string[] = [];
    const improvements: string[] = [];

    const lines = content.split("\n");
    let currentSection: "features" | "fixes" | "improvements" | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Détection des sections
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

      // Extraction des items de liste
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
   * Crée un embed Discord formaté pour un patch note
   */
  private createPatchNoteEmbed(patchNote: PatchNote & { createdBy?: { name?: string; image?: string } }): DiscordEmbed {
    const sections = this.extractSections(patchNote.content);
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    // Ajouter les nouvelles fonctionnalités
    if (sections.features.length > 0) {
      const featuresText = sections.features
        .slice(0, 5)
        .map((f) => `• ${f}`)
        .join("\n");
      fields.push({
        name: "✨ Nouvelles Fonctionnalités",
        value: this.truncateContent(featuresText, 1024),
        inline: false,
      });
    }

    // Ajouter les améliorations
    if (sections.improvements.length > 0) {
      const improvementsText = sections.improvements
        .slice(0, 5)
        .map((i) => `• ${i}`)
        .join("\n");
      fields.push({
        name: "🚀 Améliorations",
        value: this.truncateContent(improvementsText, 1024),
        inline: false,
      });
    }

    // Ajouter les corrections
    if (sections.fixes.length > 0) {
      const fixesText = sections.fixes
        .slice(0, 5)
        .map((f) => `• ${f}`)
        .join("\n");
      fields.push({
        name: "🐛 Corrections",
        value: this.truncateContent(fixesText, 1024),
        inline: false,
      });
    }

    // Si aucune section n'a été détectée, utiliser le contenu brut
    if (fields.length === 0) {
      fields.push({
        name: "📋 Contenu",
        value: this.truncateContent(patchNote.content, 1024),
        inline: false,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://plinkk.fr";
    const patchNoteUrl = `${frontendUrl}/patch-notes/${patchNote.version}`;

    // Ajouter un lien "Voir plus"
    fields.push({
      name: "\u200B",
      value: `🔗 **[Voir tous les détails sur le site](${patchNoteUrl})**`,
      inline: false,
    });

    return {
      title: `🎉 ${patchNote.title}`,
      description: `**Version ${patchNote.version}** vient d'être publiée !`,
      color: 0x7c3aed, // Violet Plinkk
      url: patchNoteUrl,
      timestamp: new Date().toISOString(),
      footer: {
        text: "Déployé avec ❤️ par l'équipe Plinkk",
        icon_url: `${process.env.CDN_URL || "https://cdn.plinkk.fr"}/logo.svg`,
      },
      thumbnail: {
        url: `${process.env.CDN_URL || "https://cdn.plinkk.fr"}/logo.svg`,
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



  /**
   * Publie un message via l'API Discord (bot)
   */
  private async publishViaBot(embed: DiscordEmbed, notifyEveryone: boolean = true): Promise<boolean> {
    if (!this.botToken || !this.channelId) {
      console.warn("[Discord] Bot token ou channel ID non configurés");
      return false;
    }

    try {
      const messageContent = notifyEveryone 
        ? "@everyone 🚀 Nouvelle mise à jour disponible !"
        : "🚀 Nouvelle mise à jour disponible !";

      const response = await fetch(`https://discord.com/api/v10/channels/${this.channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${this.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Discord] Erreur lors de l'envoi via bot:", response.status, errorText);
        return false;
      }

      const data = await response.json();
      console.log("[Discord] Patch note publié avec succès via bot, ID du message:", data.id);

      // Si c'est un channel d'annonce, publier le message pour les serveurs suiveurs
      if (data.flags !== undefined) {
        await this.publishMessage(data.id);
      }

      return true;
    } catch (error) {
      console.error("[Discord] Erreur lors de l'envoi via bot:", error);
      return false;
    }
  }

  /**
   * Publie un message (crosspost) pour les serveurs suiveurs d'un channel d'annonces
   */
  private async publishMessage(messageId: string): Promise<void> {
    if (!this.botToken || !this.channelId) {
      return;
    }

    try {
      const response = await fetch(
        `https://discord.com/api/v10/channels/${this.channelId}/messages/${messageId}/crosspost`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${this.botToken}`,
          },
        }
      );

      if (response.ok) {
        console.log("[Discord] Message publié pour les serveurs suiveurs");
      } else {
        const errorText = await response.text();
        console.error("[Discord] Erreur lors de la publication du message:", response.status, errorText);
      }
    } catch (error) {
      console.error("[Discord] Erreur lors de la publication du message:", error);
    }
  }

  /**
   * Publie un patch note sur Discord via le bot
   */
  async publishPatchNote(patchNote: PatchNote & { createdBy?: { name?: string; image?: string } }): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn("[Discord] Service Discord non configuré, publication ignorée");
      return false;
    }

    console.log(`[Discord] Publication du patch note ${patchNote.version} sur Discord...`);

    const embed = this.createPatchNoteEmbed(patchNote);

    return await this.publishViaBot(embed, patchNote.notifyEveryone ?? true);
  }
}

// Export d'une instance singleton
export const discordService = new DiscordService();
