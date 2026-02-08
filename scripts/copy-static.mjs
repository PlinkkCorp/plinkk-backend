import { promises as fs } from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function copyDir(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  await ensureDir(dest);
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const tasks = [];
  tasks.push(
    (async () => {
      try {
        await copyDir(path.join(srcDir, 'public'), path.join(distDir, 'public'));
        console.log('Copied public');
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
        console.warn('public directory not found, skipping');
      }
    })()
  );

  tasks.push(
    (async () => {
      try {
        await copyDir(path.join(srcDir, 'views'), path.join(distDir, 'views'));
        console.log('Copied views');
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
        console.warn('views directory not found, skipping');
      }
    })()
  );

  tasks.push(
    (async () => {
      try {
        await copyFile(path.join(srcDir, 'secret-key'), path.join(distDir, 'secret-key'));
        console.log('Copied secret-key');
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
        console.warn('secret-key not found, skipping');
      }
    })()
  );

  await Promise.all(tasks);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
