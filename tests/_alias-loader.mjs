// Resolves the "@/…" path alias from tsconfig for Node's test runner, so the
// pure portal modules can be imported straight from TypeScript source.
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import { existsSync } from 'node:fs'

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const base = resolvePath(root, specifier.slice(2))
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, base]) {
      if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context)
    }
  }
  return next(specifier, context)
}
