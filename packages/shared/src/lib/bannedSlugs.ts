import { BannedSlug, prisma } from "@plinkk/prisma";

// const prisma = new PrismaClient();

export async function isBannedSlug(slug: string): Promise<boolean> {
  if (!slug) return true;
  try {
    const hit = await prisma.bannedSlug.findUnique({ where: { slug: slug } });
    return !!hit;
  } catch (e) {
    return false;
  }
}

export async function listBannedSlugs(): Promise<BannedSlug[]> {
  try {
    return await prisma.bannedSlug.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (e) {
    return [];
  }
}

export async function createBannedSlug(slug: string, reason?: string) {
  try {
    return await prisma.bannedSlug.create({ data: { slug, reason: reason || null } });
  } catch (e) {
    const msg = String(e?.message || '');
    if (msg.includes('BannedSlug') && msg.includes('does not exist')) {
      throw new Error('bannedslug_table_missing');
    }
    throw e;
  }
}

export async function deleteBannedSlugById(slug: string) {
  try {
    return await prisma.bannedSlug.delete({ where: { slug } });
  } catch (e) {
    const msg = String(e?.message || '');
    if (msg.includes('BannedSlug') && msg.includes('does not exist')) {
      throw new Error('bannedslug_table_missing');
    }
    throw e;
  }
}
