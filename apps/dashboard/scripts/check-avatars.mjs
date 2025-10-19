import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fix = process.argv.includes('--fix');
  const users = await prisma.user.findMany({ select: { id: true, image: true, profileImage: true } });
  const repoRoot = process.cwd();
  const avatarsDir = path.join(repoRoot, 'src', 'public', 'uploads', 'avatars');
  const plinkkDir = path.join(repoRoot, 'src', 'public', 'uploads', 'plinkk');

  let total = 0;
  let missingFiles = 0;
  let corrupted = 0;

  for (const u of users) {
    total++;
    const img = u.image;
    if (!img) continue;

    let info = { userId: u.id, raw: img, kind: 'unknown', fileExists: null };

    if (/^data:/i.test(img)) {
      info.kind = 'data-url';
    } else if (/^https?:\/\//i.test(img)) {
      info.kind = 'external-url';
    } else if (img.startsWith('/public/uploads/avatars/')) {
      info.kind = 'public-avatar';
      const filename = img.replace('/public/uploads/avatars/', '');
      const fp = path.join(avatarsDir, filename);
      info.fileExists = fs.existsSync(fp);
      if (!info.fileExists) missingFiles++;
      // detect corrupted case: value like "/public/uploads/avatars/data:image/..."
      if (/^\/public\/uploads\/avatars\/data:/i.test(img)) {
        corrupted++;
        console.warn(`Corrupted image value for user ${u.id}: ${img}`);
        if (fix) {
          const fixed = img.replace(/^\/public\/uploads\/avatars\//i, '');
          try {
            await prisma.user.update({ where: { id: u.id }, data: { image: fixed } });
            console.info(`  -> fixed in DB for user ${u.id}`);
          } catch (e) {
            console.error(`  -> failed to fix for ${u.id}:`, e.message || e);
          }
        }
      }
    } else if (img.startsWith('/public/uploads/plinkk/')) {
      info.kind = 'public-plinkk';
      const filename = img.replace('/public/uploads/plinkk/', '');
      const fp = path.join(plinkkDir, filename);
      info.fileExists = fs.existsSync(fp);
      if (!info.fileExists) missingFiles++;
    } else if (img.startsWith('/')) {
      info.kind = 'public-other';
      const fp = path.join(repoRoot, 'src', img.replace(/^[\\/]+/,'').replace(/^public[\\/]+/,'public/'));
      info.fileExists = fs.existsSync(fp);
      if (!info.fileExists) missingFiles++;
    } else {
      // likely a raw filename like "hash.ext"
      info.kind = 'raw-filename';
      const fp = path.join(avatarsDir, img);
      info.fileExists = fs.existsSync(fp);
      if (!info.fileExists) missingFiles++;
    }

    // Print summary per-user when there's a problem
    if (info.kind === 'public-avatar' && info.fileExists === false) {
      console.log(`${u.id}: ${img} -> file MISSING`);
    } else if (info.kind === 'raw-filename' && info.fileExists === false) {
      console.log(`${u.id}: raw filename ${img} -> file MISSING in avatars dir`);
    }
  }

  console.log('\nSummary:');
  console.log(`  users scanned: ${total}`);
  console.log(`  missing files: ${missingFiles}`);
  console.log(`  corrupted entries detected: ${corrupted}`);
  if (fix) console.log('  (fix mode was used; corrupted entries were attempted to be corrected in DB)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
