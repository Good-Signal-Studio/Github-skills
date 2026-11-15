#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const files = []
for (const folder of readdirSync(root, { withFileTypes: true })) {
  if (!folder.isDirectory() || folder.name.startsWith('.')) continue
  const scriptDir = folder.name === 'scripts' ? join(root, 'scripts') : join(root, folder.name, 'scripts')
  try {
    for (const name of readdirSync(scriptDir)) if (name.endsWith('.test.mjs')) files.push(join(scriptDir, name))
  } catch (error) { if (error.code !== 'ENOENT') throw error }
}
files.sort()
const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
