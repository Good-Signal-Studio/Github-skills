#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkContent } from './enrol.mjs'

const started = performance.now()
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
const results = []
for (const phase of [
  { name: 'Node tests', command: process.execPath, args: ['--test', ...files], cwd: root },
  { name: 'Python watcher tests', command: 'python', args: ['-m', 'unittest', '-v'], cwd: join(root, 'babysit-pr', 'scripts') },
]) {
  const phaseStarted = performance.now()
  console.log(`\n=== ${phase.name} ===`)
  const result = spawnSync(phase.command, phase.args, { cwd: phase.cwd, stdio: 'inherit' })
  if (result.error) console.error(result.error.message)
  if (result.signal) console.error(`${phase.name} terminated by ${result.signal}`)
  results.push({ name: phase.name, passed: !result.error && result.status === 0 })
  console.log(`${phase.name}: ${results.at(-1).passed ? 'PASS' : 'FAIL'} (${((performance.now() - phaseStarted) / 1000).toFixed(3)}s)`)
}

console.log('\n=== Committed content sync ===')
let contentPassed = false
try {
  const revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const result = checkContent({ repoPath: root, bundleRoot: root, revision })
  console.log(`Recorded revision: ${result.recordedRevision ?? '(none)'}`)
  console.log(`Checked revision: ${result.checkedRevision}`)
  console.log(`Revision current: ${result.revisionCurrent}`)
  console.log(`Content current: ${result.contentCurrent}`)
  for (const conflict of result.conflicts) console.error(conflict)
  if (!result.contentCurrent && !result.conflicts.length) console.error('Managed content or manifest metadata differs. Inspect the enrolment plan')
  contentPassed = result.contentCurrent
} catch (error) { console.error(error.message) }
results.push({ name: 'Committed content sync', passed: contentPassed })
console.log(`Committed content sync: ${contentPassed ? 'PASS' : 'FAIL'}`)
console.log('\n=== Overall results ===')
for (const result of results) console.log(`${result.name}: ${result.passed ? 'PASS' : 'FAIL'}`)
console.log(`Elapsed: ${((performance.now() - started) / 1000).toFixed(3)}s`)
process.exitCode = results.every(result => result.passed) ? 0 : 1
