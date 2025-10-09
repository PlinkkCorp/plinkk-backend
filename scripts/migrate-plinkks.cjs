/*
  Migration: User-level profile -> default Plinkk pages
  - For each user, ensure a default Plinkk exists (index=0, isDefault=true)
  - Create PlinkkSettings from user fields (if missing)
  - Attach user content (links, labels, social icons, background colors, neon colors)
    to the default Plinkk by setting plinkkId where it's currently null
  - If a user Statusbar exists, copy it to PlinkkStatusbar for the default page (non-destructive)

  Usage:
    node scripts/migrate-plinkks.cjs             # migrate all users
    node scripts/migrate-plinkks.cjs @handle     # migrate only one user (user.id)

  Idempotent: safe to re-run; it only fills missing data.
*/

require('dotenv').config();

if (!process.env.DATABASE_URL) {
  const sqliteUrl = 'file:./prisma/dev.db';
  process.env.DATABASE_URL = sqliteUrl;
  console.log(`[migrate] DATABASE_URL not set, using ${sqliteUrl}`);
}

const { PrismaClient, Visibility } = require('../generated/prisma/client');
const prisma = new PrismaClient();

function slugify(input) {
  return String(input || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureDefaultPlinkk(user) {
  const existingDefault = await prisma.plinkk.findFirst({ where: { userId: user.id, isDefault: true } });
  if (existingDefault) return existingDefault;
  const byIndex0 = await prisma.plinkk.findFirst({ where: { userId: user.id, index: 0 } });
  if (byIndex0) {
    if (!byIndex0.isDefault) {
      await prisma.plinkk.update({ where: { id: byIndex0.id }, data: { isDefault: true } });
      byIndex0.isDefault = true;
    }
    return byIndex0;
  }
  let base = 'default';
  let candidate = base;
  let i = 2;
  while (true) {
    const found = await prisma.plinkk.findFirst({ where: { userId: user.id, slug: candidate } });
    if (!found) break;
    candidate = `${base}-${i++}`;
  }
  const created = await prisma.plinkk.create({
    data: {
      userId: user.id,
      name: user.userName || user.name || 'Page',
      slug: candidate,
      index: 0,
      isDefault: true,
      isActive: true,
      isPublic: Boolean(user.isPublic),
      visibility: user.isPublic ? Visibility.PUBLIC : Visibility.PRIVATE,
    },
  });
  return created;
}

function pick(v) { return v === undefined ? null : v; }

async function ensureSettingsForPlinkk(plinkk, user) {
  const existing = await prisma.plinkkSettings.findUnique({ where: { plinkkId: plinkk.id } }).catch(() => null);
  if (existing) return existing;
  return prisma.plinkkSettings.create({
    data: {
      plinkkId: plinkk.id,
      profileLink: pick(user.profileLink),
      profileImage: pick(user.profileImage),
      profileIcon: pick(user.profileIcon),
      profileSiteText: pick(user.profileSiteText),
      userName: pick(user.userName),
      iconUrl: pick(user.iconUrl),
      description: pick(user.description),
      profileHoverColor: pick(user.profileHoverColor),
      degBackgroundColor: user.degBackgroundColor ?? null,
      neonEnable: user.neonEnable ?? null,
      buttonThemeEnable: user.buttonThemeEnable ?? null,
      EnableAnimationArticle: user.EnableAnimationArticle ?? null,
      EnableAnimationButton: user.EnableAnimationButton ?? null,
      EnableAnimationBackground: user.EnableAnimationBackground ?? null,
      backgroundSize: user.backgroundSize ?? null,
      selectedThemeIndex: user.selectedThemeIndex ?? null,
      selectedAnimationIndex: user.selectedAnimationIndex ?? null,
      selectedAnimationButtonIndex: user.selectedAnimationButtonIndex ?? null,
      selectedAnimationBackgroundIndex: user.selectedAnimationBackgroundIndex ?? null,
      animationDurationBackground: user.animationDurationBackground ?? null,
      delayAnimationButton: user.delayAnimationButton ?? null,
      canvaEnable: user.canvaEnable ?? null,
      selectedCanvasIndex: user.selectedCanvasIndex ?? null,
    },
  });
}

async function attachContentToPlinkk(user, plinkk) {
  const [links, labels, socials, bgColors, neonColors] = await Promise.all([
    prisma.link.updateMany({ where: { userId: user.id, plinkkId: null }, data: { plinkkId: plinkk.id } }),
    prisma.label.updateMany({ where: { userId: user.id, plinkkId: null }, data: { plinkkId: plinkk.id } }),
    prisma.socialIcon.updateMany({ where: { userId: user.id, plinkkId: null }, data: { plinkkId: plinkk.id } }),
    prisma.backgroundColor.updateMany({ where: { userId: user.id, plinkkId: null }, data: { plinkkId: plinkk.id } }),
    prisma.neonColor.updateMany({ where: { userId: user.id, plinkkId: null }, data: { plinkkId: plinkk.id } }),
  ]);
  return { links, labels, socials, bgColors, neonColors };
}

async function copyStatusbar(user, plinkk) {
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { statusbar: true } });
  if (!u || !u.statusbar) return { created: false };
  const existing = await prisma.plinkkStatusbar.findUnique({ where: { plinkkId: plinkk.id } }).catch(() => null);
  if (existing) return { created: false };
  await prisma.plinkkStatusbar.create({
    data: {
      plinkkId: plinkk.id,
      text: u.statusbar.text ?? null,
      colorBg: u.statusbar.colorBg ?? null,
      colorText: u.statusbar.colorText ?? null,
      fontTextColor: u.statusbar.fontTextColor ?? null,
      statusText: u.statusbar.statusText ?? null,
    },
  });
  return { created: true };
}

async function migrateOneUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.log(`[migrate] user not found: ${userId}`);
    return { userId, skipped: true };
  }
  const defaultPlinkk = await ensureDefaultPlinkk(user);
  await ensureSettingsForPlinkk(defaultPlinkk, user);
  const changed = await attachContentToPlinkk(user, defaultPlinkk);
  const sb = await copyStatusbar(user, defaultPlinkk);
  return {
    userId: user.id,
    defaultPlinkkId: defaultPlinkk.id,
    attached: {
      links: changed.links.count,
      labels: changed.labels.count,
      socials: changed.socials.count,
      backgroundColors: changed.bgColors.count,
      neonColors: changed.neonColors.count,
    },
    statusbarCopied: sb.created,
  };
}

async function main() {
  try {
    const onlyUser = process.argv[2] || null;
    if (onlyUser) {
      console.log(`[migrate] Migrating single user: ${onlyUser}`);
      const res = await migrateOneUser(onlyUser);
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    console.log('[migrate] Loading users...');
    const users = await prisma.user.findMany({ select: { id: true } });
    console.log(`[migrate] ${users.length} user(s) found.`);
    const results = [];
    for (const u of users) {
      try {
        const r = await migrateOneUser(u.id);
        results.push(r);
        console.log(`[migrate] OK ${u.id} -> ${r.defaultPlinkkId}`);
      } catch (e) {
        console.error(`[migrate] ERROR on ${u.id}`, e?.message || e);
      }
    }
    console.log('[migrate] Done. Summary:');
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error('[migrate] Failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
