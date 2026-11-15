#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const BUNDLE_REPOSITORY = 'https://github.com/Good-Signal-Studio/Github-skills'
const MANIFEST = '.github/good-signal/manifest.json'
const COMMUNITY_MANIFEST = '.github/good-signal/community-manifest.json'
const JOURNAL = '.github/good-signal/transaction.json'
const START = '<!-- good-signal-studio:defaults:start -->'
const END = '<!-- good-signal-studio:defaults:end -->'
const LICENSES = ['LICENSE', 'LICENSE.upstream', 'UPSTREAM.md', 'upstream-manifest.json']
const sha = data => createHash('sha256').update(data).digest('hex')
const bytes = text => Buffer.from(text, 'utf8')
const read = path => existsSync(path) ? readFileSync(path) : null
const same = (a, b) => a === null ? b === null : b !== null && a.equals(b)
const jsonBytes = value => bytes(JSON.stringify(value, null, 2) + '\n')
const sameRoot = (left, right) => process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right

function portablePath(path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\') || path.includes(':') || path.includes('\0')) throw new Error(`Unsafe relative path: ${path}`)
  for (const part of path.split('/')) {
    if (!part || part === '.' || part === '..' || /[. ]$/.test(part) || /[<>"|?*]/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) throw new Error(`Unsafe path component: ${path}`)
  }
  return path
}

function beneath(root, path) {
  portablePath(path)
  const target = resolve(root, path)
  const rel = relative(root, target)
  if (rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) throw new Error(`Path escapes target: ${path}`)
  return target
}

function safeRoot(path) {
  if (!path || !isAbsolute(resolve(path))) throw new Error('An explicit repository path is required')
  const full = resolve(path)
  let cursor = full
  while (true) {
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error(`Symlink or junction is not allowed: ${cursor}`)
    const parent = dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }
  if (!existsSync(full) || !lstatSync(full).isDirectory()) throw new Error(`Repository directory does not exist: ${full}`)
  return realpathSync(full)
}

function safeTarget(root, path) {
  const target = beneath(root, path)
  let current = root
  const parts = path.split('/')
  for (let i = 0; i < parts.length; i++) {
    if (existsSync(current)) {
      const matches = readdirSync(current).filter(name => name.toLowerCase() === parts[i].toLowerCase())
      if (matches.length > 1 || (matches.length && matches[0] !== parts[i])) throw new Error(`Case collision at ${path}`)
    }
    current = join(current, parts[i])
    let info
    try { info = lstatSync(current) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
    if (info.isSymbolicLink()) throw new Error(`Symlink or junction at ${path}`)
    if (i < parts.length - 1 && !info.isDirectory()) throw new Error(`Parent is not a directory at ${path}`)
    if (i === parts.length - 1 && !info.isFile()) throw new Error(`Target is not a regular file at ${path}`)
  }
  return target
}

function git(root, ...args) {
  if (!['rev-parse', 'cat-file', 'status', 'ls-tree'].includes(args[0])) throw new Error('Only read-only local Git inspection is allowed')
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 }).trim()
}

export function inventory({ bundleRoot, revision, requireClean = false }) {
  const root = safeRoot(bundleRoot)
  if (!/^[0-9a-f]{40}$/i.test(revision ?? '')) throw new Error('revision must be a full 40-character Git commit SHA')
  const pinned = revision.toLowerCase()
  if (!sameRoot(safeRoot(git(root, 'rev-parse', '--show-toplevel')), root)) throw new Error('bundleRoot must be the bundle checkout root')
  if (git(root, 'rev-parse', 'HEAD') !== pinned || git(root, 'cat-file', '-t', pinned) !== 'commit') throw new Error('Requested revision must match the bundle checkout HEAD commit')
  if (requireClean && git(root, 'status', '--porcelain', '--untracked-files=no')) throw new Error('Bundle tracked files must be clean before apply')
  const tracked = git(root, 'ls-tree', '-r', '-z', pinned).split('\0').filter(Boolean).map(entry => {
    const match = /^(\d+) (\w+) ([0-9a-f]{40})\t([\s\S]+)$/.exec(entry)
    if (!match) throw new Error('Cannot parse bundle Git tree')
    return { mode: match[1], type: match[2], blob: match[3], path: portablePath(match[4]) }
  })
  const skills = tracked.filter(item => /^[^/]+\/SKILL\.md$/.test(item.path)).map(item => item.path.split('/')[0]).sort()
  if (!skills.length) throw new Error('Bundle contains no root skill folders')
  const selected = tracked.filter(item => skills.some(skill => item.path.startsWith(`${skill}/`)) || LICENSES.includes(item.path) || item.path === 'defaults/DEFAULTS.md' || item.path.startsWith('community/'))
  for (const required of [...LICENSES, 'defaults/DEFAULTS.md']) if (!selected.some(item => item.path === required)) throw new Error(`Bundle is missing tracked ${required}`)
  const files = new Map()
  const modes = {}
  const names = new Set()
  for (const item of selected) {
    if (item.type !== 'blob' || !['100644', '100755'].includes(item.mode)) throw new Error(`Bundle contains a link or non-file: ${item.path}`)
    const folded = item.path.toLowerCase()
    if (names.has(folded)) throw new Error(`Bundle case collision: ${item.path}`)
    names.add(folded)
    const content = readFileSync(safeTarget(root, item.path))
    const blob = createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex')
    if (blob !== item.blob) throw new Error(`Bundle file differs from requested revision: ${item.path}`)
    files.set(item.path, content)
    modes[item.path] = item.mode
  }
  const hashes = Object.fromEntries([...files].map(([path, data]) => [path, sha(data)]))
  return { root, revision: pinned, skills, files, hashes, modes, hash: sha(jsonBytes({ hashes, modes })) }
}

function ownedPath(path, mode) {
  portablePath(path)
  if (mode === 'community') return /^\.github\/(?:ISSUE_TEMPLATE\/[^/]+|PULL_REQUEST_TEMPLATE\.md|good-signal\/(?:community-manifest\.json|LICENSE(?:\.upstream)?|UPSTREAM\.md|upstream-manifest\.json))$/.test(path)
  return /^\.(?:agents|claude)\/skills\/[^/]+\/.+/.test(path) || /^\.github\/(?:ISSUE_TEMPLATE\/[^/]+|PULL_REQUEST_TEMPLATE\.md|good-signal\/(?:manifest\.json|DEFAULTS\.md|LICENSE(?:\.upstream)?|UPSTREAM\.md|upstream-manifest\.json))$/.test(path)
}

function loadManifest(root, path, mode) {
  const raw = read(safeTarget(root, path))
  if (raw === null) return null
  const value = JSON.parse(raw.toString('utf8'))
  if (value.schema !== 1 || value.mode !== mode || typeof value.files !== 'object' || !value.files || typeof value.blocks !== 'object' || !value.blocks) throw new Error(`Unsupported managed manifest at ${path}`)
  for (const [name, hash] of Object.entries(value.files)) if (!ownedPath(name, mode) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid owned file in manifest: ${name}`)
  for (const [name, hash] of Object.entries(value.blocks)) if (!['AGENTS.md', 'CLAUDE.md'].includes(name) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid instruction block in manifest: ${name}`)
  return value
}

function blockRange(content) {
  if (content === null) return null
  const start = content.indexOf(bytes(START))
  const end = content.indexOf(bytes(END))
  if (start < 0 && end < 0) return null
  if (start < 0 || end < start || content.indexOf(bytes(START), start + 1) >= 0 || content.indexOf(bytes(END), end + 1) >= 0) throw new Error('Malformed or repeated managed instruction block')
  return { start, end: end + bytes(END).length, content: content.subarray(start, end + bytes(END).length) }
}

function managedBlock(text) { return bytes(`${START}\n${text}\n${END}`) }

function appendBlock(original, block) {
  if (original === null) return Buffer.concat([block, bytes('\n')])
  return Buffer.concat([original, bytes(original.length && original.at(-1) !== 10 ? '\n\n' : '\n'), block, bytes('\n')])
}

function instructionContent(name) {
  return managedBlock(name === 'AGENTS.md'
    ? 'Read `.github/good-signal/DEFAULTS.md` for the shared organisation defaults.\nThis repository\'s branch, test, dependency, security and approval rules take precedence.\nSkills are available in `.agents/skills/` for Codex and `.claude/skills/` for Claude.'
    : '@AGENTS.md')
}

function present(root, directory, re) {
  const folder = resolve(root, directory)
  if (!existsSync(folder)) return false
  if (lstatSync(folder).isSymbolicLink()) throw new Error(`Symlink or junction at ${directory}`)
  if (!lstatSync(folder).isDirectory()) throw new Error(`Not a directory: ${directory}`)
  return readdirSync(folder).some(name => re.test(name))
}

function walkFiles(root, prefix) {
  const directory = resolve(root, prefix)
  if (!existsSync(directory)) return []
  if (lstatSync(directory).isSymbolicLink() || !lstatSync(directory).isDirectory()) throw new Error(`Managed directory is a link or non-directory: ${prefix}`)
  return readdirSync(directory).flatMap(name => {
    const path = `${prefix}/${name}`
    portablePath(path)
    const info = lstatSync(resolve(root, path))
    if (info.isSymbolicLink()) throw new Error(`Symlink or junction at ${path}`)
    return info.isDirectory() ? walkFiles(root, path) : [path]
  })
}

export function plan({ repoPath, bundleRoot, revision, communityTarget = false, requireClean = false }) {
  const root = safeRoot(repoPath)
  const result = { repoPath: root, bundleRoot: resolve(bundleRoot), revision, mode: communityTarget ? 'community' : 'repository', instructions: {}, skills: [], changes: [], skips: [], conflicts: [] }
  for (const name of ['AGENTS.md', 'AGENTS.override.md', 'CLAUDE.md']) {
    try { const content = read(safeTarget(root, name)); result.instructions[name] = content === null ? null : content.toString('utf8') } catch (error) { result.conflicts.push(`${name}: ${error.message}`) }
  }
  try {
    if (!existsSync(join(root, '.git'))) throw new Error('repoPath must be an existing Git checkout, including a newly initialised repository')
    const source = inventory({ bundleRoot, revision, requireClean })
    result.bundleRoot = source.root
    result.revision = source.revision
    result.skills = communityTarget ? [] : source.skills
    const rel = relative(source.root, root)
    const reverse = relative(root, source.root)
    if (!sameRoot(source.root, root) && ((!rel.startsWith('..') && !isAbsolute(rel)) || (!reverse.startsWith('..') && !isAbsolute(reverse)))) throw new Error('Bundle and consumer paths must not overlap')
    safeTarget(root, JOURNAL)
    if (existsSync(join(root, JOURNAL))) throw new Error(`Interrupted transaction detected. Run recover --repoPath "${root}" after inspecting ${JOURNAL}`)
    if (!communityTarget && result.instructions['AGENTS.override.md'] !== null) throw new Error('Root AGENTS.override.md bypasses AGENTS.md in Codex. Add a reviewed project reference or remove that override before enrolment. No files were changed')
    const manifestPath = communityTarget ? COMMUNITY_MANIFEST : MANIFEST
    const previous = loadManifest(root, manifestPath, result.mode)
    const desired = new Map()
    const modes = {}
    if (!communityTarget) {
      for (const runtime of ['.agents', '.claude']) for (const skill of source.skills) {
        const prefix = `${runtime}/skills/${skill}`
        for (const [path, data] of source.files) if (path.startsWith(`${skill}/`)) {
          const target = `${prefix}/${path.slice(skill.length + 1)}`
          desired.set(target, data)
          modes[target] = source.modes[path]
        }
        for (const license of ['LICENSE', 'LICENSE.upstream']) desired.set(`${prefix}/${license}`, source.files.get(license))
        for (const extra of walkFiles(root, prefix)) if (!(previous?.files && Object.hasOwn(previous.files, extra))) result.conflicts.push(`Existing unowned file in managed skill directory: ${extra}`)
      }
      desired.set('.github/good-signal/DEFAULTS.md', source.files.get('defaults/DEFAULTS.md'))
    }
    for (const path of LICENSES) desired.set(`.github/good-signal/${path}`, source.files.get(path))
    const ownedIssue = previous && Object.keys(previous.files).some(path => path.startsWith('.github/ISSUE_TEMPLATE/'))
    const issuePresent = present(root, '.github', /^issue_template$/i)
    if (ownedIssue || !issuePresent) {
      for (const [path, data] of source.files) if (path.startsWith('community/.github/ISSUE_TEMPLATE/')) desired.set(path.slice('community/'.length), data)
    } else result.skips.push('Existing ISSUE_TEMPLATE directory disables the complete organisation issue fallback. Kept all local issue files')
    const ownPr = previous && Object.hasOwn(previous.files, '.github/PULL_REQUEST_TEMPLATE.md')
    const prPresent = ['', '.github', 'docs'].some(dir => present(root, dir, /^pull_request_template(?:\.md)?$/i))
    if (ownPr || !prPresent) desired.set('.github/PULL_REQUEST_TEMPLATE.md', source.files.get('community/.github/PULL_REQUEST_TEMPLATE.md'))
    else result.skips.push('Existing project PR template takes precedence')
    if (previous) for (const path of Object.keys(previous.files)) if (!desired.has(path)) result.conflicts.push(`Previously owned path was removed from the bundle. Reconcile it manually: ${path}`)
    const next = {
      schema: 1, mode: result.mode,
      bundle: { repository: BUNDLE_REPOSITORY, revision: source.revision, sourceFilesSha256: source.hash, sourceFiles: source.hashes, sourceFileModes: source.modes },
      upstream: { repository: 'https://github.com/Jeff-Kazzee/github-skills', revision: '8ce6fda01a1cca24b20a406e3efd8f087bf70264', manifest: '.github/good-signal/upstream-manifest.json' },
      licences: ['.github/good-signal/LICENSE', '.github/good-signal/LICENSE.upstream'],
      skills: result.skills, files: {}, modes: {}, blocks: {},
    }
    const operations = []
    for (const [path, content] of desired) {
      if (!content) throw new Error(`Missing source payload for ${path}`)
      const target = safeTarget(root, path)
      const current = read(target)
      const priorHash = previous?.files[path]
      if (current !== null && (!priorHash || sha(current) !== priorHash)) result.conflicts.push(`Refusing to overwrite ${priorHash ? 'locally edited managed' : 'existing unowned'} file: ${path}`)
      if (current === null && priorHash) result.conflicts.push(`Managed file was removed locally: ${path}`)
      next.files[path] = sha(content)
      const afterMode = modes[path] === '100755' ? 0o755 : 0o644
      const beforeMode = current === null ? null : lstatSync(target).mode & 0o777
      if (process.platform !== 'win32' && priorHash && previous.modes?.[path] && beforeMode !== previous.modes[path]) result.conflicts.push(`Managed file permissions were edited locally: ${path}`)
      next.modes[path] = afterMode
      if (!same(current, content) || (process.platform !== 'win32' && beforeMode !== afterMode)) operations.push({ path, before: current, after: content, beforeMode, afterMode })
    }
    if (!communityTarget) for (const path of ['AGENTS.md', 'CLAUDE.md']) {
      const current = read(safeTarget(root, path))
      const range = blockRange(current)
      const priorHash = previous?.blocks[path]
      if (priorHash && (!range || sha(range.content) !== priorHash)) result.conflicts.push(`Managed instruction block was edited or removed: ${path}`)
      if (range && !priorHash) result.conflicts.push(`Unowned instruction block already exists: ${path}`)
      if (path === 'CLAUDE.md' && !range && !priorHash && current?.toString('utf8').split(/\r?\n/).some(line => /^\s*@(?:\.\/)?AGENTS\.md\s*$/.test(line))) {
        result.skips.push('CLAUDE.md already imports @AGENTS.md')
        continue
      }
      const block = instructionContent(path)
      next.blocks[path] = sha(block)
      const after = range ? Buffer.concat([current.subarray(0, range.start), block, current.subarray(range.end)]) : appendBlock(current, block)
      if (!same(current, after)) operations.push({ path, before: current, after, beforeMode: current === null ? null : lstatSync(join(root, path)).mode & 0o777, afterMode: current === null ? 0o644 : lstatSync(join(root, path)).mode & 0o777 })
    }
    const manifestBefore = read(safeTarget(root, manifestPath))
    const manifestAfter = jsonBytes(next)
    if (!same(manifestBefore, manifestAfter)) operations.push({ path: manifestPath, before: manifestBefore, after: manifestAfter, beforeMode: manifestBefore === null ? null : lstatSync(join(root, manifestPath)).mode & 0o777, afterMode: 0o644 })
    result.changes = operations.map(op => ({ path: op.path, action: op.before === null ? 'create' : 'update', beforeSha256: op.before === null ? null : sha(op.before), afterSha256: sha(op.after), mode: op.afterMode }))
    Object.defineProperty(result, '_operations', { value: operations })
  } catch (error) { result.conflicts.push(error.message) }
  return result
}

function ensureParents(root, path, made) {
  const components = path.split('/').slice(0, -1)
  let current = root
  for (const part of components) {
    current = join(current, part)
    if (!existsSync(current)) { mkdirSync(current); made.push(current) }
  }
}

function restore(root, entries, attempted = new Set()) {
  for (const entry of [...entries].reverse()) {
    const target = safeTarget(root, entry.path)
    const current = read(target)
    const before = entry.before === null ? null : Buffer.from(entry.before, 'base64')
    const after = Buffer.from(entry.after, 'base64')
    if (!attempted.has(entry.path) && !same(current, before) && !same(current, after)) throw new Error(`Recovery refuses a subsequent local edit at ${entry.path}`)
    if (same(current, before)) continue
    if (before === null) unlinkSync(target)
    else { writeFileSync(target, before); if (entry.beforeMode !== null && entry.beforeMode !== undefined) chmodSync(target, entry.beforeMode) }
  }
}

export function apply(options, { write = (path, content, flags) => writeFileSync(path, content, flags) } = {}) {
  const proposal = plan({ ...options, requireClean: true })
  if (proposal.conflicts.length) return { ...proposal, applied: false }
  if (!proposal._operations?.length) return { ...proposal, applied: true }
  const root = proposal.repoPath
  const made = []
  const entries = proposal._operations.map(op => ({ path: op.path, before: op.before?.toString('base64') ?? null, after: op.after.toString('base64'), beforeMode: op.beforeMode, afterMode: op.afterMode }))
  const journal = { schema: 1, mode: proposal.mode, entries }
  let journalCreated = false
  const attempted = new Set()
  try {
    for (const entry of proposal._operations) {
      if (!same(read(safeTarget(root, entry.path)), entry.before)) throw new Error(`Target changed since preflight: ${entry.path}`)
    }
    ensureParents(root, JOURNAL, made)
    writeFileSync(safeTarget(root, JOURNAL), jsonBytes(journal), { flag: 'wx' })
    journalCreated = true
    for (const entry of proposal._operations) {
      const target = safeTarget(root, entry.path)
      if (!same(read(target), entry.before)) throw new Error(`Target changed during apply: ${entry.path}`)
      ensureParents(root, entry.path, made)
      attempted.add(entry.path)
      write(target, entry.after, { flag: entry.before === null ? 'wx' : 'w', mode: entry.afterMode })
      chmodSync(target, entry.afterMode)
      if (!same(readFileSync(target), entry.after)) throw new Error(`Readback failed: ${entry.path}`)
    }
    unlinkSync(join(root, JOURNAL))
    return { ...proposal, applied: true }
  } catch (error) {
    if (journalCreated) {
      try { restore(root, entries, attempted); unlinkSync(join(root, JOURNAL)); journalCreated = false } catch (rollbackError) {
        return { ...proposal, applied: false, conflicts: [...proposal.conflicts, error.message, `Rollback incomplete: ${rollbackError.message}. Inspect ${JOURNAL} and run recover`] }
      }
    }
    for (const dir of [...made].reverse()) { try { rmdirSync(dir) } catch {} }
    return { ...proposal, applied: false, conflicts: [...proposal.conflicts, `Apply failed and original bytes were restored: ${error.message}`] }
  }
}

export function recover({ repoPath }) {
  const root = safeRoot(repoPath)
  const path = safeTarget(root, JOURNAL)
  if (!existsSync(path)) throw new Error('No interrupted transaction to recover')
  const journal = JSON.parse(readFileSync(path, 'utf8'))
  if (journal.schema !== 1 || !['repository', 'community'].includes(journal.mode) || !Array.isArray(journal.entries)) throw new Error('Invalid transaction journal')
  const seen = new Set()
  for (const entry of journal.entries) {
    if ((!ownedPath(entry.path, journal.mode) && !(journal.mode === 'repository' && ['AGENTS.md', 'CLAUDE.md'].includes(entry.path))) || seen.has(entry.path.toLowerCase()) || !(entry.before === null || typeof entry.before === 'string') || typeof entry.after !== 'string') throw new Error('Unsafe transaction entry')
    for (const mode of [entry.beforeMode, entry.afterMode]) if (mode !== undefined && mode !== null && (!Number.isInteger(mode) || mode < 0 || mode > 0o777)) throw new Error('Unsafe transaction permissions')
    seen.add(entry.path.toLowerCase())
    safeTarget(root, entry.path)
    const current = read(resolve(root, entry.path))
    const before = entry.before === null ? null : Buffer.from(entry.before, 'base64')
    if (!same(current, before) && !same(current, Buffer.from(entry.after, 'base64'))) throw new Error(`Recovery refuses a subsequent local edit at ${entry.path}`)
  }
  restore(root, journal.entries)
  unlinkSync(path)
  return { recovered: true, repoPath: root, restoredFiles: journal.entries.length }
}

export function check(options) {
  const proposal = plan(options)
  return { ...proposal, current: !proposal.conflicts.length && !proposal.changes.length }
}

function main(args) {
  const options = {}
  let command = args.shift()
  if (command === '--check') command = 'check'
  if (command === '--plan') command = 'plan'
  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    if (key === '--community-target') options.communityTarget = true
    else if (['--repoPath', '--bundleRoot', '--revision'].includes(key) && args[i + 1] && !args[i + 1].startsWith('--')) options[key.slice(2)] = args[++i]
    else throw new Error(`Unknown or incomplete option: ${key}`)
  }
  if (!options.repoPath || (!options.bundleRoot && command !== 'recover')) throw new Error('Usage: node scripts/enrol.mjs plan|apply|check --repoPath <checkout> --bundleRoot <bundle checkout> --revision <40-char SHA> [--community-target]. Recovery: recover --repoPath <checkout>')
  let result
  if (command === 'plan') result = plan(options)
  else if (command === 'apply') result = apply(options)
  else if (command === 'check') result = check(options)
  else if (command === 'recover') result = recover(options)
  else throw new Error(`Unknown command: ${command}`)
  console.log(JSON.stringify(result, null, 2))
  if (result.conflicts?.length || result.applied === false || result.current === false) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)) } catch (error) { console.error(error.message); process.exitCode = 1 }
}
