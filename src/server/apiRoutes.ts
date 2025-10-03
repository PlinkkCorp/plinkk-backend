import { FastifyInstance } from "fastify";
import { PrismaClient, Role } from "../../generated/prisma/client";
import path from "path";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import crypto from "crypto";
import z from "zod";
import bcrypt from "bcrypt";
import { authenticator } from "otplib";
import QRCode from "qrcode"

const prisma = new PrismaClient();

export function apiRoutes(fastify: FastifyInstance) {
  // API: uploader/remplacer la photo de profil (avatar) via data URL (base64)
  fastify.post("/me/avatar", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { dataUrl } = (request.body as any) || {};
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return reply.code(400).send({ error: "Invalid payload" });
    }
    try {
      const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(
        dataUrl
      );
      if (!match)
        return reply.code(400).send({ error: "Unsupported image format" });
      const mime = match[1].toLowerCase();
      const base64 = match[3];
      const buf = Buffer.from(base64, "base64");
      // Limite stricte: 128 Ko
      if (buf.byteLength > 128 * 1024) {
        return reply
          .code(413)
          .send({ error: "Image trop lourde (max 128 Ko)" });
      }
      const ext = mime.endsWith("png")
        ? "png"
        : mime.endsWith("webp")
        ? "webp"
        : "jpg";
      const dir = path.join(__dirname, "public", "uploads", "avatars");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      // Déduplication par hash
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      const dedupName = `${hash}.${ext}`;
      const filePath = path.join(dir, dedupName);
      const publicUrl = `/public/uploads/avatars/${dedupName}`;

      // Récupérer l'ancienne image du compte (stockée comme nom de fichier ou ancienne URL)
      const me = await prisma.user.findUnique({
        where: { id: userId as string },
        select: { image: true },
      });
      const oldVal = me?.image || null;

      if (!existsSync(filePath)) {
        writeFileSync(filePath, buf);
      }

      // Mettre à jour l'utilisateur avec l'URL publique complète (compat templates/UI)
      await prisma.user.update({
        where: { id: userId as string },
        data: { image: publicUrl },
      });

      // Nettoyage: tenter de supprimer l'ancienne image si non référencée par d'autres
      if (oldVal && oldVal !== publicUrl) {
        const refs = await prisma.user.count({ where: { image: oldVal } });
        if (refs === 0) {
          try {
            let oldPath = "";
            if (oldVal.startsWith("/public/uploads/avatars/")) {
              oldPath = path.join(
                __dirname,
                oldVal.replace(/^\/public\//, "public/")
              );
            } else {
              // ancien format stocké comme "hash.ext"
              oldPath = path.join(dir, oldVal);
            }
            if (existsSync(oldPath)) unlinkSync(oldPath);
          } catch {}
        }
      }

      return reply.send({ ok: true, file: dedupName, url: publicUrl });
    } catch (e) {
      request.log.error(e);
      return reply.code(500).send({ error: "Upload failed" });
    }
  });

  // API: mise à jour de rôle (admin/dev/moderator)
  fastify.post("/users/:id/role", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const { role } = (request.body as any) || {};
    if (!Object.values(Role).includes(role))
      return reply.code(400).send({ error: "Invalid role" });
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    return reply.send({ id: updated.id, role: updated.role });
  });

  // API: régler les cosmétiques (ex: flair, bannerUrl, frame) — admin/dev/moderator
  fastify.post("/users/:id/cosmetics", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    const cosmetics = (request.body as any) ?? null;
    const updated = await prisma.user.update({
      where: { id },
      data: { cosmetics },
      include: { cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  // API: suppression d'un utilisateur (admin/dev/moderator)
  fastify.delete("/users/:id", async (request, reply) => {
    const meId = request.session.get("data");
    if (!meId) return reply.code(401).send({ error: "Unauthorized" });
    const me = await prisma.user.findUnique({ where: { id: meId as string }, select: { role: true } });
    if (!(me && (me.role === Role.ADMIN || me.role === Role.DEVELOPER || me.role === Role.MODERATOR))) {
      return reply.code(403).send({ error: "Forbidden" });
    }
    const { id } = request.params as { id: string };
    await prisma.$transaction([
      prisma.link.deleteMany({ where: { userId: id } }),
      prisma.label.deleteMany({ where: { userId: id } }),
      prisma.socialIcon.deleteMany({ where: { userId: id } }),
      prisma.backgroundColor.deleteMany({ where: { userId: id } }),
      prisma.neonColor.deleteMany({ where: { userId: id } }),
      prisma.statusbar.deleteMany({ where: { userId: id } }),
      prisma.cosmetic.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return reply.send({ ok: true });
  });

  // API: Récupérer la configuration complète du profil pour l'éditeur
  fastify.get("/me/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const profile = await prisma.user.findFirst({
      where: { id: userId as string },
      include: {
        background: true,
        labels: true,
        neonColors: true,
        socialIcons: true,
        statusbar: true,
        links: true,
      },
    });
    if (!profile) return reply.code(404).send({ error: "Not found" });

    const config = {
      profileLink: profile.profileLink,
      profileImage: profile.profileImage,
      profileIcon: profile.profileIcon,
      profileSiteText: profile.profileSiteText,
      userName: profile.userName,
      // Email public (découplé de l'email de connexion): stocké dans User.publicEmail
      // Fallback vers l'email de compte pour compat rétro (affichage uniquement)
      email: (profile as any).publicEmail ?? profile.email ?? "",
      iconUrl: profile.iconUrl,
      description: profile.description,
      profileHoverColor: profile.profileHoverColor,
      degBackgroundColor: profile.degBackgroundColor,
      neonEnable: profile.neonEnable,
      buttonThemeEnable: profile.buttonThemeEnable,
      EnableAnimationArticle: profile.EnableAnimationArticle,
      EnableAnimationButton: profile.EnableAnimationButton,
      EnableAnimationBackground: profile.EnableAnimationBackground,
      backgroundSize: profile.backgroundSize,
      selectedThemeIndex: profile.selectedThemeIndex,
      selectedAnimationIndex: profile.selectedAnimationIndex,
      selectedAnimationButtonIndex: profile.selectedAnimationButtonIndex,
      selectedAnimationBackgroundIndex:
        profile.selectedAnimationBackgroundIndex,
      animationDurationBackground: profile.animationDurationBackground,
      delayAnimationButton: profile.delayAnimationButton,
      canvaEnable: profile.canvaEnable,
      selectedCanvasIndex: profile.selectedCanvasIndex,
      background: profile.background?.map((c) => c.color) ?? [],
      neonColors: profile.neonColors?.map((c) => c.color) ?? [],
      labels:
        profile.labels?.map((l) => ({
          data: l.data,
          color: l.color,
          fontColor: l.fontColor,
        })) ?? [],
      socialIcon:
        profile.socialIcons?.map((s) => ({ url: s.url, icon: s.icon })) ?? [],
      links:
        profile.links?.map((l) => ({
          icon: l.icon,
          url: l.url,
          text: l.text,
          name: l.name,
          description: l.description,
          showDescriptionOnHover: l.showDescriptionOnHover,
          showDescription: l.showDescription,
        })) ?? [],
      statusbar: profile.statusbar ?? null,
    };

    return reply.send(config);
  });

  // API: Mettre à jour la configuration du profil depuis l'éditeur
  fastify.put("/me/config", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const body = (request.body as any) ?? {};
    const pickDefined = (obj: Record<string, any>) =>
      Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
      );

    await prisma.$transaction(async (tx) => {
      const userData = pickDefined({
        profileLink: body.profileLink,
        profileImage: body.profileImage,
        profileIcon: body.profileIcon,
        profileSiteText: body.profileSiteText,
        userName: body.userName,
        // email public (champ distinct)
        publicEmail: body.email,
        iconUrl: body.iconUrl,
        description: body.description,
        profileHoverColor: body.profileHoverColor,
        degBackgroundColor: body.degBackgroundColor,
        neonEnable: body.neonEnable,
        buttonThemeEnable: body.buttonThemeEnable,
        EnableAnimationArticle: body.EnableAnimationArticle,
        EnableAnimationButton: body.EnableAnimationButton,
        EnableAnimationBackground: body.EnableAnimationBackground,
        backgroundSize: body.backgroundSize,
        selectedThemeIndex: body.selectedThemeIndex,
        selectedAnimationIndex: body.selectedAnimationIndex,
        selectedAnimationButtonIndex: body.selectedAnimationButtonIndex,
        selectedAnimationBackgroundIndex: body.selectedAnimationBackgroundIndex,
        animationDurationBackground: body.animationDurationBackground,
        delayAnimationButton: body.delayAnimationButton,
        canvaEnable: body.canvaEnable,
        selectedCanvasIndex: body.selectedCanvasIndex,
      });
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId as string },
          data: userData,
        });
      }

      // Plus de persistance dans cosmetics: publicEmail est un champ dédié.

      if (Array.isArray(body.background)) {
        await tx.backgroundColor.deleteMany({
          where: { userId: userId as string },
        });
        if (body.background.length > 0) {
          await tx.backgroundColor.createMany({
            data: body.background.map((color: string) => ({
              color,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.neonColors)) {
        await tx.neonColor.deleteMany({ where: { userId: userId as string } });
        if (body.neonColors.length > 0) {
          await tx.neonColor.createMany({
            data: body.neonColors.map((color: string) => ({
              color,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.labels)) {
        await tx.label.deleteMany({ where: { userId: userId as string } });
        if (body.labels.length > 0) {
          await tx.label.createMany({
            data: body.labels.map((l: any) => ({
              data: l.data,
              color: l.color,
              fontColor: l.fontColor,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.socialIcon)) {
        await tx.socialIcon.deleteMany({ where: { userId: userId as string } });
        if (body.socialIcon.length > 0) {
          await tx.socialIcon.createMany({
            data: body.socialIcon.map((s: any) => ({
              url: s.url,
              icon: s.icon,
              userId: userId as string,
            })),
          });
        }
      }

      if (Array.isArray(body.links)) {
        await tx.link.deleteMany({ where: { userId: userId as string } });
        if (body.links.length > 0) {
          await tx.link.createMany({
            data: body.links.map((l: any) => ({
              icon: l.icon ?? undefined,
              url: l.url,
              text: l.text ?? undefined,
              name: l.name ?? undefined,
              description: l.description ?? undefined,
              showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
              showDescription: l.showDescription ?? undefined,
              userId: userId as string,
            })),
          });
        }
      }

      if (body.statusbar !== undefined) {
        const s = body.statusbar;
        if (s === null) {
          await tx.statusbar.deleteMany({
            where: { userId: userId as string },
          });
        } else {
          await tx.statusbar.upsert({
            where: { userId: userId as string },
            create: {
              userId: userId as string,
              text: s.text ?? undefined,
              colorBg: s.colorBg ?? undefined,
              fontTextColor: s.fontTextColor ?? undefined,
              statusText: s.statusText ?? undefined,
            },
            update: pickDefined({
              text: s.text ?? undefined,
              colorBg: s.colorBg ?? undefined,
              fontTextColor: s.fontTextColor ?? undefined,
              statusText: s.statusText ?? undefined,
            }),
          });
        }
      }
    });

    return reply.send({ ok: true });
  });

  // Catalogue d'icônes disponibles pour l'éditeur
  fastify.get("/icons", async (request, reply) => {
    const iconsDir = path.join(__dirname, "public", "images", "icons");
    if (!existsSync(iconsDir)) return reply.send([]);
    const entries = readdirSync(iconsDir, { withFileTypes: true });
    const toTitle = (s: string) =>
      s
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b(\w)/g, (_, c: string) => c.toUpperCase());
    const list = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".svg"))
      .map((e) => {
        const slug = e.name.replace(/\.svg$/i, "");
        return { slug, displayName: toTitle(slug) };
      });
    return reply.send(list);
  });

  // API: basculer la visibilité publique/privée de son profil
  fastify.post("/me/visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { isPublic } = (request.body as any) ?? {};
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { isPublic: Boolean(isPublic) },
      select: { id: true, isPublic: true },
    });
    return reply.send(updated);
  });

  // API: changer l'email
  fastify.post("/me/email", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { email } = (request.body as any) || {};
    try {
      z.email().parse(email);
    } catch (e) {
      return reply.code(400).send({ error: "Email invalide" });
    }
    // vérifier unicité
    const exists = await prisma.user.findFirst({
      where: { email, NOT: { id: userId as string } },
      select: { id: true },
    });
    if (exists) return reply.code(409).send({ error: "Email déjà utilisé" });
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { email },
      select: { id: true, email: true },
    });
    return reply.send(updated);
  });

  // API: changer le mot de passe
  fastify.post("/me/password", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { currentPassword, newPassword, confirmPassword } =
      (request.body as any) || {};
    if (!currentPassword || !newPassword || !confirmPassword)
      return reply.code(400).send({ error: "Champs manquants" });
    if (newPassword !== confirmPassword)
      return reply
        .code(400)
        .send({ error: "Les mots de passe ne correspondent pas" });
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });
    if (!user)
      return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok)
      return reply.code(403).send({ error: "Mot de passe actuel incorrect" });
    if (await bcrypt.compare(newPassword, user.password))
      return reply
        .code(400)
        .send({ error: "Nouveau mot de passe identique à l'actuel" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId as string },
      data: { password: hashed },
    });
    return reply.send({ ok: true });
  });

  // API: supprimer mon compte (mdp + TOTP si activé)
  fastify.post("/me/delete", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { password, otp } = (request.body as any) || {};
    if (!password) return reply.code(400).send({ error: "Mot de passe requis" });
    const me = await prisma.user.findUnique({ where: { id: userId as string } });
    if (!me) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const ok = await bcrypt.compare(password, me.password);
    if (!ok) return reply.code(403).send({ error: "Mot de passe incorrect" });
    if (me.totpSecret && me.totpSecret !== "") {
      if (!otp || typeof otp !== "string") return reply.code(400).send({ error: "Code 2FA requis" });
      const valid = authenticator.check(otp, me.totpSecret);
      if (!valid) return reply.code(403).send({ error: "Code 2FA invalide" });
    }
    await prisma.$transaction([
      prisma.link.deleteMany({ where: { userId: userId as string } }),
      prisma.label.deleteMany({ where: { userId: userId as string } }),
      prisma.socialIcon.deleteMany({ where: { userId: userId as string } }),
      prisma.backgroundColor.deleteMany({ where: { userId: userId as string } }),
      prisma.neonColor.deleteMany({ where: { userId: userId as string } }),
      prisma.statusbar.deleteMany({ where: { userId: userId as string } }),
      prisma.cosmetic.deleteMany({ where: { userId: userId as string } }),
      prisma.user.delete({ where: { id: userId as string } }),
    ]);
    request.session.delete();
    return reply.send({ ok: true });
  });

  // API: basculer la visibilité publique de l'email (stockée dans cosmetics.settings.isEmailPublic)
  fastify.post("/me/email-visibility", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { isEmailPublic } = (request.body as any) ?? {};
    const u = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { cosmetics: true },
    });
    const cosmetics: any = (u?.cosmetics as any) || {};
    cosmetics.settings = {
      ...(cosmetics.settings || {}),
      isEmailPublic: Boolean(isEmailPublic),
    };
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { cosmetics },
      select: { id: true, cosmetics: true },
    });
    return reply.send({
      id: updated.id,
      isEmailPublic: Boolean(
        (updated.cosmetics as any)?.settings?.isEmailPublic
      ),
    });
  });

  // API: basculer la 2FA
  fastify.post("/me/2fa", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (user.totpSecret === "") {
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(user.userName, "Plinkk", secret);
      const qrCode = await QRCode.toDataURL(otpauth);
  
      const update = prisma.user.update({
        where: {
          id: userId
        },
        data: {
          totpSecret: secret
        }
      })
  
      return { qrCode, otpauth };
    } else {
      const update = prisma.user.update({
        where: {
          id: userId
        },
        data: {
          totpSecret: ""
        }
      })
  
      return { "successful": true };
    }

  });

  // API: mettre à jour des infos de base du compte (username, name, description)
  fastify.post("/me/profile", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as any) || {};
    const data: any = {};
    if (typeof body.userName === "string" && body.userName.trim())
      data.userName = body.userName.trim();
    if (typeof body.name === "string" && body.name.trim())
      data.name = body.name.trim();
    if (typeof body.description === "string")
      data.description = body.description;
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data,
      select: { id: true, userName: true, name: true, description: true },
    });
    return reply.send(updated);
  });

  // API: sélectionner des cosmétiques (flair, bannerUrl, frame, theme)
  fastify.post("/me/cosmetics", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const body = (request.body as any) || {};
    const u = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { cosmetics: true },
    });
    const cosmetics: any = (u?.cosmetics as any) || {};
    cosmetics.selected = {
      // Le flair n'est plus modifiable par l'utilisateur (uniquement via code/admin)
      flair: cosmetics.selected?.flair ?? null,
      bannerUrl: body.bannerUrl ?? cosmetics.selected?.bannerUrl ?? null,
      banner: body.banner ?? cosmetics.selected?.banner ?? null,
      frame: body.frame ?? cosmetics.selected?.frame ?? null,
      theme: body.theme ?? cosmetics.selected?.theme ?? null,
    };
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { cosmetics },
      select: { id: true, cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });

  // API: appliquer un starter pack de cosmétiques
  fastify.post("/me/cosmetics/starter-pack", async (request, reply) => {
    const userId = request.session.get("data");
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const u = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { role: true, cosmetics: true },
    });
    if (!u) return reply.code(404).send({ error: "Utilisateur introuvable" });
    const baseFlair =
      u.role === Role.ADMIN || u.role === Role.DEVELOPER ? "DEVELOPER" : "OG";
    const cosmetics: any = (u.cosmetics as any) || {};
    // Le starter pack n'attribue plus de flair automatiquement (laisse tel quel)
    cosmetics.selected = {
      flair: cosmetics.selected?.flair ?? null,
      frame: "neon",
      theme: "dark-emerald",
      banner: "gradient-emerald",
      bannerUrl: "",
    };
    const updated = await prisma.user.update({
      where: { id: userId as string },
      data: { cosmetics },
      select: { id: true, cosmetics: true },
    });
    return reply.send({ id: updated.id, cosmetics: updated.cosmetics });
  });
}
