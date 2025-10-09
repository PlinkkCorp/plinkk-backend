import { PrismaClient } from '../../generated/prisma/client';

const prisma = new PrismaClient();

// Retourne true si le slug est banni (DB) ou s'il appartient à la liste en mémoire
export async function isBannedSlug(slug: string): Promise<boolean> {
  if (!slug) return true;
  try {
    const hit = await prisma.bannedSlug.findUnique({ where: { slug } });
    return !!hit;
  } catch (e) {
    // Si la table BannedSlug n'existe pas, on tombe sur false pour ne pas bloquer la création
    return false;
  }
}

// Liste (lecture) de tous les bans: renvoie [] si table manquante
export async function listBannedSlugs(): Promise<any[]> {
  try {
    return await prisma.bannedSlug.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (e) {
    return [];
  }
}

// Crée un ban, renvoie l'objet créé ou lance l'erreur (considéré unique check upstream)
export async function createBannedSlug(slug: string, reason?: string) {
  try {
    return await prisma.bannedSlug.create({ data: { slug, reason: reason || null } });
  } catch (e: any) {
    // If the underlying table is missing, surface a clear error the caller can handle.
    const msg = String(e?.message || '');
    if (msg.includes('BannedSlug') && msg.includes('does not exist')) {
      throw new Error('bannedslug_table_missing');
    }
    throw e;
  }
}

export async function deleteBannedSlugById(id: string) {
  try {
    return await prisma.bannedSlug.delete({ where: { id } });
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('BannedSlug') && msg.includes('does not exist')) {
      throw new Error('bannedslug_table_missing');
    }
    throw e;
  }
}
