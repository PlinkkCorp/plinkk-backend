import { FastifyInstance } from "fastify";
import { Label, Link, NeonColor, PlinkkStatusbar, SocialIcon, prisma } from "@plinkk/prisma";
import { pickDefined } from "../../../../lib/plinkkUtils";
import { logUserAction } from "../../../../lib/userLogger";
import { calculateArrayDiff, calculateObjectDiff } from "../../../../lib/diffUtils";
import { createPlinkkVersion } from "../../../services/historyService";


async function validatePlinkkOwnership(userId: string | undefined, plinkkId: string) {
  if (!userId) return null;
  return prisma.plinkk.findFirst({ where: { id: plinkkId, userId: String(userId) } });
}

export function plinkksSettingsRoutes(fastify: FastifyInstance) {
  fastify.put("/:id/config/background", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { background: (string | { color: string })[] };
    const list = Array.isArray(body?.background) ? body.background : [];
    const colors = list
      .map((item) =>
        typeof item === "string"
          ? item
          : item && typeof item.color === "string"
            ? item.color
            : null
      )
      .filter((c): c is string => !!c && typeof c === "string" && c.trim() !== "");

    const existingBg = await prisma.backgroundColor.findMany({ where: { userId, plinkkId: id } });
    const oldColors = existingBg.map(b => b.color);
    const newColors = colors;

    // Simple array diff for primitives
    const added = newColors.filter(c => !oldColors.includes(c));
    const removed = oldColors.filter(c => !newColors.includes(c));

    await prisma.backgroundColor.deleteMany({ where: { userId, plinkkId: id } });
    if (colors.length > 0) {
      await prisma.backgroundColor.createMany({
        data: colors.map((color) => ({ color, userId, plinkkId: id })),
      });
    }

    if (added.length > 0 || removed.length > 0) {
      const changes: (string | any)[] = [];
      added.forEach(c => changes.push({ key: 'background', new: c, type: 'added' as const }));
      removed.forEach(c => changes.push({ key: 'background', old: c, type: 'removed' as const }));

      await logUserAction(userId, "UPDATE_PLINKK_BACKGROUND", id, {
        diff: { background: { added, removed } },
        changes: changes.map(c => typeof c === 'string' ? c : `${c.type === 'added' ? 'Added' : 'Removed'} background color: ${c.new || c.old}`),
        formatted: `Updated background: +${added.length} added, -${removed.length} removed`
      }, request.ip);

      const label = added.length > 0 ? `Ajout arrière-plan (${added.length})` :
        removed.length > 0 ? `Suppression arrière-plan (${removed.length})` :
          "Mise à jour arrière-plan";
      createPlinkkVersion(id, userId, label, false, changes).catch(err => request.log.error(err));
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/labels", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { labels: Label[] };

    if (Array.isArray(body.labels)) {
      const oldLabels = await prisma.label.findMany({ where: { userId, plinkkId: id } });
      // Labels don't seem to have stable IDs from the frontend based on this code (it deletes all and recreates).
      // We'll treat them as a fresh list and diff by properties or just log the new state vs old state count ?
      // Since they are recreated, we can try to diff by content if we want "every little detail".
      // Let's rely on content diffing.

      const changes = {
        old: oldLabels.map(l => ({ text: l.data, color: l.color, fontColor: l.fontColor })),
        new: body.labels.map(l => ({ text: l.data, color: l.color, fontColor: l.fontColor }))
      };

      await prisma.label.deleteMany({ where: { userId, plinkkId: id } });
      if (body.labels.length > 0) {
        await prisma.label.createMany({
          data: body.labels.map((l) => ({
            data: l.data,
            color: l.color,
            fontColor: l.fontColor,
            userId,
            plinkkId: id,
          })),
        });
      }
      // Only log if something actually changed?
      // Diffing labels by content is expensive if we just wiped them.
      // But we can check if old count != new count OR if JSON stringified content differs.
      // For now, let's trust that if the endpoint is called with data, we log it.
      // But the user complained about spam.
      // Let's do a quick check:
      const hasChanges = JSON.stringify(changes.old) !== JSON.stringify(changes.new);

      if (hasChanges) {
        const readableChanges: string[] = [];
        const structuredChanges: any[] = [];

        if (changes.old.length !== changes.new.length) {
          readableChanges.push(`Label count: ${changes.old.length} -> ${changes.new.length}`);
        } else {
          readableChanges.push("Updated labels content");
        }

        structuredChanges.push({ key: 'labels', old: changes.old, new: changes.new, type: 'updated' as const });

        await logUserAction(userId, "UPDATE_PLINKK_LABELS", id, {
          diff: changes, // This is actually the object diff structure
          changes: readableChanges, // Our string array
          formatted: `Updated labels: ${body.labels.length} active`
        }, request.ip);

        createPlinkkVersion(id, userId, `Mise à jour étiquettes (${body.labels.length} actives)`, false, structuredChanges).catch(err => request.log.error(err));
      }

    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/socialIcon", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { socialIcon: SocialIcon[] };

    if (Array.isArray(body.socialIcon)) {
      const oldSocials = await prisma.socialIcon.findMany({ where: { userId, plinkkId: id } });

      // Similar to labels, they seem to be wipes and recreated.
      // Log old vs new content.
      const changes = {
        old: oldSocials.map(s => ({ icon: s.icon, url: s.url })),
        new: body.socialIcon.map(s => ({ icon: s.icon, url: s.url }))
      };

      await prisma.socialIcon.deleteMany({ where: { userId, plinkkId: id } });
      if (body.socialIcon.length > 0) {
        await prisma.socialIcon.createMany({
          data: body.socialIcon.map((s) => ({
            url: s.url,
            icon: s.icon,
            userId,
            plinkkId: id,
          })),
        });
      }
      const hasChanges = JSON.stringify(changes.old) !== JSON.stringify(changes.new);
      if (hasChanges) {
        const readableChanges: string[] = [];
        const structuredChanges: any[] = [];
        if (changes.old.length !== changes.new.length) {
          readableChanges.push(`Social icons count: ${changes.old.length} -> ${changes.new.length}`);
        } else {
          readableChanges.push("Updated social icons");
        }
        structuredChanges.push({ key: 'socialIcon', old: changes.old, new: changes.new, type: 'updated' as const });

        await logUserAction(userId, "UPDATE_PLINKK_SOCIALS", id, {
          diff: changes,
          changes: readableChanges,
          formatted: `Updated social icons: ${body.socialIcon.length} active`
        }, request.ip);

        createPlinkkVersion(id, userId, `Mise à jour réseaux sociaux (${body.socialIcon.length} actifs)`, false, structuredChanges).catch(err => request.log.error(err));
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/links", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { links: Link[] };

    if (Array.isArray(body.links)) {
      const existing = await prisma.link.findMany({
        where: { userId, plinkkId: id },
      });
      const existingIds = new Set(existing.map((l) => l.id));
      const incomingIds = new Set(body.links.map((l) => l.id).filter(Boolean));
      const toDelete = Array.from(existingIds).filter((x) => !incomingIds.has(x));

      if (toDelete.length > 0)
        await prisma.link.deleteMany({ where: { id: { in: toDelete } } });

      for (const l of body.links) {
        const baseLinkData = {
          icon: l.icon ?? undefined,
          url: l.url,
          text: l.text ?? undefined,
          name: l.name === null ? null : typeof l.name === "string" ? l.name : undefined,
          description: l.description ?? undefined,
          showDescriptionOnHover: l.showDescriptionOnHover ?? undefined,
          showDescription: l.showDescription ?? undefined,
          buttonTheme: l.buttonTheme || "system",
          iosUrl: l.iosUrl ?? null,
          androidUrl: l.androidUrl ?? null,
          forceAppOpen: l.forceAppOpen ?? false,
          type: l.type || "LINK",
          index: typeof l.index === 'number' ? l.index : 0,
          clickLimit: l.clickLimit ?? null,
          embedData: l.embedData ?? null,
          formData: l.formData ?? null,
        };

        if (l.id && existingIds.has(l.id)) {
          await prisma.link.update({
            where: { id: l.id },
            data: {
              ...baseLinkData,
              category: l.categoryId
                ? { connect: { id: l.categoryId } }
                : { disconnect: true },
            },
          });
        } else {
          await prisma.link.create({
            data: {
              ...baseLinkData,
              userId,
              plinkkId: id,
              category: l.categoryId
                ? { connect: { id: l.categoryId } }
                : undefined,
            },
          });
        }
      }

      const updatedLinks = await prisma.link.findMany({ where: { userId, plinkkId: id } });

      // Calculate diff using the fully populated old and new lists
      const diff = calculateArrayDiff(existing, updatedLinks, "id", ["userId", "plinkkId", "createdAt", "updatedAt", "clicks"]);
      const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0 || diff.reordered;
      if (hasChanges) {
        const changes: string[] = [];
        const structuredChanges: any[] = [];
        diff.added.forEach((l: any) => {
          changes.push(`Added Link: ${l.text || l.url}`);
          structuredChanges.push({ key: 'link', new: l.text || l.url, type: 'added' as const });
        });
        diff.removed.forEach((l: any) => {
          changes.push(`Removed Link: ${l.text || l.url}`);
          structuredChanges.push({ key: 'link', old: l.text || l.url, type: 'removed' as const });
        });
        diff.updated.forEach((u: any) => {
          const keys = Object.keys(u.changes).join(', ');
          changes.push(`Updated Link '${u.item.text || u.item.url}': ${keys}`);
          structuredChanges.push({ key: 'link', old: u.item.text || u.item.url, new: u.item.text || u.item.url, type: 'updated' as const, detail: keys });
        });
        if (diff.reordered) {
          changes.push("Reordered links");
          structuredChanges.push({ key: 'links', type: 'reordered' as const });
        }

        await logUserAction(userId, "UPDATE_PLINKK_LINKS", id, {
          diff,
          changes,
          formatted: `Updated links: ${updatedLinks.length} active`
        }, request.ip);

        let linkLabel = "Mise à jour liens";
        if (diff.added.length > 0) linkLabel = `Ajout liens (+${diff.added.length})`;
        else if (diff.removed.length > 0) linkLabel = `Suppression liens (-${diff.removed.length})`;
        else if (diff.reordered) linkLabel = "Réorganisation liens";
        else if (diff.updated.length > 0) linkLabel = "Modification liens";

        createPlinkkVersion(id, userId, linkLabel, false, structuredChanges).catch(err => request.log.error(err));
        return reply.send({
          ok: true,
          links: updatedLinks.map((l) => ({
            id: l.id,
            icon: l.icon,
            url: l.url,
            text: l.text,
            name: l.name,
            description: l.description,
            showDescriptionOnHover: l.showDescriptionOnHover,
            showDescription: l.showDescription,
            categoryId: l.categoryId,
            type: l.type,
            embedData: l.embedData,
            formData: l.formData,
            iosUrl: l.iosUrl,
            androidUrl: l.androidUrl,
            forceAppOpen: l.forceAppOpen,
            clickLimit: l.clickLimit,
            // @ts-ignore
            buttonTheme: l.buttonTheme,
          })),
        });
      }
    }

    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/categories", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { categories: { id?: string; name: string; order: number }[] };

    if (Array.isArray(body.categories)) {
      const existing = await prisma.category.findMany({
        where: { plinkkId: id },
      });
      const existingIds = new Set(existing.map((c) => c.id));
      const incomingIds = new Set(body.categories.map((c) => c.id).filter(Boolean));
      const toDelete = Array.from(existingIds).filter((x) => !incomingIds.has(x as string));

      if (toDelete.length > 0)
        await prisma.category.deleteMany({ where: { id: { in: toDelete as string[] } } });

      for (const c of body.categories) {
        if (c.id && existingIds.has(c.id)) {
          await prisma.category.update({
            where: { id: c.id },
            data: { name: c.name, order: c.order },
          });
        } else {
          await prisma.category.create({
            data: { name: c.name, order: c.order, plinkkId: id },
          });
        }
      }

      const updatedCategories = await prisma.category.findMany({
        where: { plinkkId: id },
        orderBy: { order: "asc" },
      });

      // Calculate diff using fully populated lists
      const diff = calculateArrayDiff(existing, updatedCategories, "id", ["plinkkId", "createdAt", "updatedAt"]);
      const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.updated.length > 0 || diff.reordered;
      if (hasChanges) {
        const readableChanges = diff.added.map((c: any) => `Added Category: ${c.name}`).concat(
          diff.removed.map((c: any) => `Removed Category: ${c.name}`),
          diff.updated.map((c: any) => `Updated Category: ${c.item.name}`),
          diff.reordered ? ["Reordered categories"] : []
        );

        const structuredChanges: any[] = [];
        diff.added.forEach((c: any) => structuredChanges.push({ key: 'category', new: c.name, type: 'added' as const }));
        diff.removed.forEach((c: any) => structuredChanges.push({ key: 'category', old: c.name, type: 'removed' as const }));
        diff.updated.forEach((c: any) => structuredChanges.push({ key: 'category', old: c.item.name, new: c.item.name, type: 'updated' as const }));
        if (diff.reordered) structuredChanges.push({ key: 'categories', type: 'reordered' as const });

        await logUserAction(userId, "UPDATE_PLINKK_CATEGORIES", id, {
          diff,
          changes: readableChanges,
          formatted: `Updated categories: ${updatedCategories.length} active`
        }, request.ip);

        let catLabel = "Mise à jour catégories";
        if (diff.added.length > 0) catLabel = `Ajout catégorie (+${diff.added.length})`;
        else if (diff.removed.length > 0) catLabel = `Suppression catégorie (-${diff.removed.length})`;
        else if (diff.reordered) catLabel = "Réorganisation catégories";

        createPlinkkVersion(id, userId, catLabel, false, structuredChanges).catch(err => request.log.error(err));
      }

      return reply.send({
        ok: true,
        categories: updatedCategories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
      });
    }



    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/statusBar", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { statusbar: PlinkkStatusbar };

    if (body.statusbar !== undefined) {
      const s = body.statusbar;
      if (s === null) {
        await prisma.plinkkStatusbar.deleteMany({ where: { plinkkId: id } });
      } else {
        await prisma.plinkkStatusbar.upsert({
          where: { plinkkId: id },
          create: {
            plinkkId: id,
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

      const oldStatus = await prisma.plinkkStatusbar.findUnique({ where: { plinkkId: id } });
      const changes = calculateObjectDiff(oldStatus || {}, body.statusbar, ["id", "plinkkId"]);

      // Use logDetailedAction for object diff consistency (it wraps in 'diff' property)
      // But here we already calculated 'changes' with calculateObjectDiff.
      // So we just wrap it manually.
      if (Object.keys(changes).length > 0) {
        const structuredChanges = Object.keys(changes).map(key => ({
          key: `statusbar.${key}`,
          old: (oldStatus as any)?.[key],
          new: (body.statusbar as any)?.[key],
          type: 'updated' as const
        }));

        await logUserAction(userId, "UPDATE_PLINKK_STATUSBAR", id, {
          diff: changes,
          formatted: "Updated status bar settings"
        }, request.ip);

        createPlinkkVersion(id, userId, "Mise à jour barre de statut", false, structuredChanges).catch(err => request.log.error(err));
      }
    }



    return reply.send({ ok: true });
  });

  fastify.put("/:id/config/neonColor", async (request, reply) => {
    const userId = request.session.get("data") as string | undefined;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });
    const { id } = request.params as { id: string };
    if (!(await validatePlinkkOwnership(userId, id)))
      return reply.code(404).send({ error: "Plinkk introuvable" });

    const body = request.body as { neonColors: NeonColor[] };

    if (Array.isArray(body.neonColors)) {
      const existingNeon = await prisma.neonColor.findMany({ where: { userId, plinkkId: id } });
      const oldColors = existingNeon.map(c => c.color);
      const newColors = body.neonColors.map(c => c.color);

      const changes = {
        added: newColors.filter(c => !oldColors.includes(c)),
        removed: oldColors.filter(c => !newColors.includes(c))
      };

      await prisma.neonColor.deleteMany({ where: { userId, plinkkId: id } });
      if (body.neonColors.length > 0) {
        await prisma.neonColor.createMany({
          data: body.neonColors.map((neonColor) => ({
            color: neonColor.color,
            userId,
            plinkkId: id,
          })),
        });
      }
      if (changes.added.length > 0 || changes.removed.length > 0) {
        const structuredChanges: any[] = [];
        changes.added.forEach(c => structuredChanges.push({ key: 'neonColor', new: c, type: 'added' as const }));
        changes.removed.forEach(c => structuredChanges.push({ key: 'neonColor', old: c, type: 'removed' as const }));

        await logUserAction(userId, "UPDATE_PLINKK_NEON", id, {
          diff: { neonColors: changes },
          formatted: `Updated neon colors: ${newColors.length} active`
        }, request.ip);

        createPlinkkVersion(id, userId, "Mise à jour couleurs néon", false, structuredChanges).catch(err => request.log.error(err));
      }
    }



    return reply.send({ ok: true });
  });
}
