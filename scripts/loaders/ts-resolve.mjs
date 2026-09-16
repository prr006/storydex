/**
 * Resolve hook: lets Node run the app's TypeScript modules directly.
 *
 * The app is bundled by Next/Turbopack, so its modules import each other
 * without file extensions (`from './anilist'`). Node's ESM resolver requires
 * explicit extensions, so without this hook any script that imports app code
 * fails on the first relative import.
 *
 * This only rewrites extensionless *relative* specifiers — package imports and
 * already-suffixed paths pass straight through.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CANDIDATES = ['.ts', '.tsx', '.mts', '.js', '/index.ts', '/index.tsx']

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../')
  const hasExtension = /\.[a-z0-9]+$/i.test(specifier)

  if (isRelative && !hasExtension && context.parentURL) {
    for (const extension of CANDIDATES) {
      const candidate = new URL(specifier + extension, context.parentURL)
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(specifier + extension, context)
      }
    }
  }

  return nextResolve(specifier, context)
}
