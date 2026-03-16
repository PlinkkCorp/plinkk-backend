/**
 * Lib Generate Bundle
 * - generateBundle -> Promise<void>
 */

import { generateBundle as sharedGenerateBundle } from '@plinkk/shared';
import path from 'path';

/**
 * Generates the bundle for the dashboard
 * @returns A promise that resolves when the bundle is generated
 */
export async function generateBundle() {
  return sharedGenerateBundle(path.join(__dirname, '..', 'public'));
}
