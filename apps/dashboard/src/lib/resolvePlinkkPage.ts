import { PrismaClient, Visibility } from "@plinkk/prisma/generated/prisma/client";
import { FastifyRequest } from "fastify";

// Détermine si l'identifiant est numérique (index) ou un slug
export function parseIdentifier(id?: string | null): { kind: 'default' | 'index' | 'slug'; value?: number | string } {
  if (!id || id === '' || id === 'default') return { kind: 'default' };
  if (id === '0') return { kind: 'default' };
  if (/^\d+$/.test(id)) return { kind: 'index', value: Number(id) };
  return { kind: 'slug', value: id };
}

export async function resolvePlinkkPage(prisma: PrismaClient, username: string, identifier: string | undefined, request?: FastifyRequest) {
  const user = await prisma.user.findUnique({ where: { id: username }, select: { id: true, role: true } });
  if (!user) return { status: 404 as const, error: 'user_not_found' };

  const parsed = parseIdentifier(identifier);
  let page = await (async () => {
    if (parsed.kind === 'default') {
      const byDefault = await prisma.plinkk.findFirst({ where: { userId: user.id, isDefault: true } });
      if (byDefault) return byDefault;
      return prisma.plinkk.findFirst({ where: { userId: user.id, index: 0 } });
    }
    if (parsed.kind === 'index') {
      return prisma.plinkk.findFirst({ where: { userId: user.id, index: parsed.value as number } });
    }
    return prisma.plinkk.findFirst({ where: { userId: user.id, slug: parsed.value as string } });
  })();

  if (!page) return { status: 404 as const, error: 'page_not_found' };
  if (!page.isActive) return { status: 403 as const, error: 'page_inactive' };
  const isPrivate = page.visibility === Visibility.PRIVATE;
  const sessionUserId = request ? (request.session.get('data') as string | undefined) : undefined;
  const isOwner = !!sessionUserId && sessionUserId === user.id;
  if (isPrivate && !isOwner) return { status: 403 as const, error: 'forbidden' };

  // Analytics: incrémenter vues et PageStat + table journalière (hors mode preview)
  const isPreview = (request?.query as { preview: string })?.preview === '1';
  if (!isPreview) {
    try {
      await prisma.$transaction([
        prisma.plinkk.update({ where: { id: page.id }, data: { views: { increment: 1 } } }),
        prisma.pageStat.create({ data: { plinkkId: page.id, eventType: 'view', ip: request?.ip || undefined } }),
      ]);
      // table journalière (raw, compatible SQLite)
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d = String(now.getUTCDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      await prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "PlinkkViewDaily" ("plinkkId" TEXT NOT NULL, "date" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ("plinkkId","date"))'
      );
      await prisma.$executeRawUnsafe(
        'INSERT INTO "PlinkkViewDaily" ("plinkkId","date","count") VALUES (?,?,1) ON CONFLICT("plinkkId","date") DO UPDATE SET "count" = "count" + 1',
        page.id,
        dateStr
      );
    } catch {}
  }

  return { status: 200 as const, user, page };
}
