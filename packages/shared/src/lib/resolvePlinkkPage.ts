import { PrismaClient, Visibility } from "@plinkk/prisma";
import { FastifyRequest } from "fastify";
import "@fastify/secure-session";

export function parseIdentifier(id?: string | null): { kind: 'default' | 'index' | 'slug'; value?: number | string } {
  if (!id || id === '' || id === 'default') return { kind: 'default' };
  if (id === '0') return { kind: 'default' };
  if (/^\d+$/.test(id)) return { kind: 'index', value: Number(id) };
  return { kind: 'slug', value: id };
}

export async function resolvePlinkkPage(prisma: PrismaClient, username: string, identifier: string | undefined, request?: FastifyRequest): Promise<any> {
  let user = await prisma.user.findUnique({ where: { id: username }, select: { id: true, role: true } });
  if (!user) {
    // Si pas trouvé par ID, on tente par userName (insensible à la casse si possible)
    user = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { id: username },
          { userName: { equals: username, mode: 'insensitive' } }
        ]
      }, 
      select: { id: true, role: true } 
    });
  }
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

  const isPreview = (request?.query as { preview: string })?.preview === '1';

  return { status: 200 as const, user, page };
}
