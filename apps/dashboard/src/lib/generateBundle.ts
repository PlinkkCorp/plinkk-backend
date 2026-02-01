import { generateBundle as sharedGenerateBundle } from '@plinkk/shared';
import path from 'path';

export async function generateBundle() {
  return sharedGenerateBundle(path.join(__dirname, '..', 'public'));
}
