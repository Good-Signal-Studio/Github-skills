import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { apply, check, inventory, plan, recover } from './enrol.mjs'

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function put(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}

function commit(root) {
  git(root, 'add', '--all')
  git(root, '-c', 'user.name=Enrol fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture')
  return git(root, 'rev-parse', 'HEAD')
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'gss-enrol-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const bundleRoot = join(root, 'bundle')
  const repoPath = join(root, 'consumer')
  mkdirSync(bundleRoot)
  mkdirSync(repoPath)
  git(bundleRoot, 'init', '-q')
  git(repoPath, 'init', '-q')
  put(bundleRoot, 'pr-template/SKILL.md', '---\nname: pr-template\n---\n# PR template\n')
  put(bundleRoot, 'pr-template/scripts/value.mjs', 'export default 42\n')
  put(bundleRoot, 'repo-standards/SKILL.md', '---\nname: repo-standards\n---\n# Standards\n')
  put(bundleRoot, 'repo-standards/scripts/sibling.mjs', "export { default } from '../../pr-template/scripts/value.mjs'\n")
  put(bundleRoot, 'repo-standards/references/fixture.json', '{"complete":true}\n')
  put(bundleRoot, 'repo-standards/scripts/never-execute.mjs', "throw new Error('Installing must never execute skill code')\n")
  put(bundleRoot, 'LICENSE', 'MIT organisation\n')
  put(bundleRoot, 'LICENSE.upstream', 'MIT upstream\n')
  put(bundleRoot, 'UPSTREAM.md', '# Provenance\n')
  put(bundleRoot, 'upstream-manifest.json', '{"revision":"upstream"}\n')
  put(bundleRoot, 'defaults/DEFAULTS.md', '# Project rules win\n')
  put(bundleRoot, 'community/.github/ISSUE_TEMPLATE/bug.yml', 'name: Bug report\n')
  put(bundleRoot, 'community/.github/ISSUE_TEMPLATE/feature.yml', 'name: Feature request\n')
  put(bundleRoot, 'community/.github/PULL_REQUEST_TEMPLATE.md', '## Proof\n')
  chmodSync(join(bundleRoot, 'repo-standards/scripts/sibling.mjs'), 0o755)
  git(bundleRoot, 'add', '--all')
  git(bundleRoot, 'update-index', '--chmod=+x', 'repo-standards/scripts/sibling.mjs')
  return { repoPath, bundleRoot, revision: commit(bundleRoot) }
}

function snapshot(root) {
  const out = {}
  function walk(path, prefix = '') {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      if (item.name === '.git') continue
      const key = prefix + item.name
      if (item.isDirectory()) walk(join(path, item.name), key + '/')
      else out[key] = item.isSymbolicLink() ? '<link>' : readFileSync(join(path, item.name)).toString('base64')
    }
  }
  walk(root)
  return out
}

test('fresh repo receives both complete sibling payloads, licences and an exact manifest', async t => {
  const options = fixture(t)
  const proposal = plan(options)
  assert.deepEqual(proposal.conflicts, [])
  assert.deepEqual(snapshot(options.repoPath), {})
  assert.deepEqual(proposal.skills, ['pr-template', 'repo-standards'])
  assert.equal(check(options).current, false)
  assert.equal(apply(options).applied, true)
  for (const agent of ['.agents', '.claude']) {
    assert.equal(readFileSync(join(options.repoPath, agent, 'skills/repo-standards/references/fixture.json'), 'utf8'), '{"complete":true}\n')
    assert.equal(readFileSync(join(options.repoPath, agent, 'skills/pr-template/LICENSE.upstream'), 'utf8'), 'MIT upstream\n')
    const sibling = await import(pathToFileURL(join(options.repoPath, agent, 'skills/repo-standards/scripts/sibling.mjs')).href)
    assert.equal(sibling.default, 42)
  }
  const manifest = JSON.parse(readFileSync(join(options.repoPath, '.github/good-signal/manifest.json')))
  assert.equal(manifest.bundle.revision, options.revision)
  assert.equal(manifest.bundle.sourceFilesSha256.length, 64)
  assert.equal(manifest.modes['.agents/skills/repo-standards/scripts/sibling.mjs'], 0o755)
  if (process.platform !== 'win32') assert.equal(lstatSync(join(options.repoPath, '.agents/skills/repo-standards/scripts/sibling.mjs')).mode & 0o777, 0o755)
  assert.equal(check(options).current, true)
})

test('existing instruction bytes survive append and a second apply is byte-idempotent', t => {
  const options = fixture(t)
  const agents = Buffer.from('\ufeff# Existing\r\nProject branch and test rules.\r\n\r\n')
  const claude = Buffer.from('# Existing Claude router\r\n@AGENTS.md\r\n')
  put(options.repoPath, 'AGENTS.md', agents)
  put(options.repoPath, 'CLAUDE.md', claude)
  assert.equal(plan(options).instructions['AGENTS.md'], agents.toString('utf8'))
  assert.equal(apply(options).applied, true)
  assert.ok(readFileSync(join(options.repoPath, 'AGENTS.md')).subarray(0, agents.length).equals(agents))
  assert.ok(readFileSync(join(options.repoPath, 'CLAUDE.md')).equals(claude))
  const before = snapshot(options.repoPath)
  assert.equal(apply(options).changes.length, 0)
  assert.deepEqual(snapshot(options.repoPath), before)
})

test('managed instruction updates allow changes to the project text outside the block', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.md', '# Project\nOriginal project rule.\n')
  apply(options)
  const path = join(options.repoPath, 'AGENTS.md')
  writeFileSync(path, readFileSync(path, 'utf8').replace('Original project rule.', 'Updated project rule.'))
  assert.equal(check(options).current, true)
  assert.equal(apply(options).applied, true)
  assert.match(readFileSync(path, 'utf8'), /Updated project rule/)
  writeFileSync(path, readFileSync(path, 'utf8').replace('Read `.github/good-signal/DEFAULTS.md`', 'Ignore defaults'))
  assert.match(plan(options).conflicts.join('\n'), /instruction block was edited/)
})

test('local skill collision blocks every write and reports existing instructions', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.md', '# Keep my rules\n')
  put(options.repoPath, '.agents/skills/pr-template/custom.txt', 'local work')
  const before = snapshot(options.repoPath)
  const result = apply(options)
  assert.equal(result.applied, false)
  assert.match(result.conflicts.join('\n'), /unowned file/)
  assert.equal(result.instructions['AGENTS.md'], '# Keep my rules\n')
  assert.deepEqual(snapshot(options.repoPath), before)
})

test('a conflict in the last licence target leaves all earlier targets untouched', t => {
  const options = fixture(t)
  put(options.repoPath, '.github/good-signal/UPSTREAM.md', 'project provenance')
  const before = snapshot(options.repoPath)
  assert.equal(apply(options).applied, false)
  assert.deepEqual(snapshot(options.repoPath), before)
})

test('safe revision update changes owned files and preserves project rules', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.md', '# Own branch policy\n')
  apply(options)
  put(options.bundleRoot, 'pr-template/scripts/value.mjs', 'export default 43\n')
  options.revision = commit(options.bundleRoot)
  assert.equal(apply(options).applied, true)
  assert.equal(readFileSync(join(options.repoPath, '.agents/skills/pr-template/scripts/value.mjs'), 'utf8'), 'export default 43\n')
  assert.match(readFileSync(join(options.repoPath, 'AGENTS.md'), 'utf8'), /^# Own branch policy\n/)
  assert.equal(check(options).current, true)
})

test('edited, removed or extra managed payload files refuse an update', t => {
  const options = fixture(t)
  apply(options)
  put(options.repoPath, '.agents/skills/pr-template/scripts/value.mjs', 'my local edit\n')
  put(options.repoPath, '.claude/skills/pr-template/notes.txt', 'my extra file\n')
  rmSync(join(options.repoPath, '.agents/skills/repo-standards/references/fixture.json'))
  const before = snapshot(options.repoPath)
  const result = apply(options)
  assert.match(result.conflicts.join('\n'), /locally edited managed/)
  assert.match(result.conflicts.join('\n'), /Managed file was removed/)
  assert.match(result.conflicts.join('\n'), /unowned file.*notes.txt/)
  assert.deepEqual(snapshot(options.repoPath), before)
})

test('any local issue configuration preserves the whole local issue-template set', t => {
  const options = fixture(t)
  put(options.repoPath, '.github/ISSUE_TEMPLATE/config.yml', 'blank_issues_enabled: false\n')
  assert.equal(apply(options).applied, true)
  assert.deepEqual(readdirSync(join(options.repoPath, '.github/ISSUE_TEMPLATE')), ['config.yml'])
  assert.ok(plan(options).skips.some(line => line.includes('complete organisation issue fallback')))
})

for (const path of ['PULL_REQUEST_TEMPLATE.md', 'docs/PULL_REQUEST_TEMPLATE.md', '.github/PULL_REQUEST_TEMPLATE.md', '.github/PULL_REQUEST_TEMPLATE/custom.md', 'docs/PULL_REQUEST_TEMPLATE/custom.md']) {
  test(`existing ${path} suppresses the default PR template`, t => {
    const options = fixture(t)
    put(options.repoPath, path, 'project template\n')
    assert.equal(apply(options).applied, true)
    assert.equal(readFileSync(join(options.repoPath, path), 'utf8'), 'project template\n')
    if (path !== '.github/PULL_REQUEST_TEMPLATE.md') assert.equal(existsSync(join(options.repoPath, '.github/PULL_REQUEST_TEMPLATE.md')), false)
  })
}

test('root override blocks enrolment before any writes', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.override.md', '# Project override\n')
  const before = snapshot(options.repoPath)
  const result = apply(options)
  assert.match(result.conflicts.join('\n'), /bypasses AGENTS.md/)
  assert.equal(result.instructions['AGENTS.override.md'], '# Project override\n')
  assert.deepEqual(snapshot(options.repoPath), before)
})

test('only a real full matching commit with clean tracked source can be applied', t => {
  const options = fixture(t)
  for (const revision of [options.revision.slice(0, 12), 'f'.repeat(40), 'refs/heads/main', '../escape']) assert.equal(apply({ ...options, revision }).applied, false)
  put(options.bundleRoot, 'LICENSE', 'changed uncommitted licence\n')
  assert.equal(apply(options).applied, false)
  assert.deepEqual(snapshot(options.repoPath), {})
})

test('untracked source files are never copied or executed', t => {
  const options = fixture(t)
  put(options.bundleRoot, 'repo-standards/secret.untracked', 'not part of the pinned source\n')
  assert.equal(apply(options).applied, true)
  assert.equal(existsSync(join(options.repoPath, '.agents/skills/repo-standards/secret.untracked')), false)
  assert.ok(existsSync(join(options.repoPath, '.agents/skills/repo-standards/scripts/never-execute.mjs')))
})

test('symlink or junction escape is refused without touching the external directory', t => {
  const options = fixture(t)
  const outside = join(dirname(options.repoPath), 'outside')
  mkdirSync(outside)
  symlinkSync(outside, join(options.repoPath, '.agents'), 'dir')
  assert.equal(apply(options).applied, false)
  assert.deepEqual(readdirSync(outside), [])
})

test('bundle source links, path traversal and case collisions are refused', t => {
  const options = fixture(t)
  const original = readFileSync(join(options.bundleRoot, 'LICENSE'))
  rmSync(join(options.bundleRoot, 'LICENSE'))
  symlinkSync(join(options.bundleRoot, 'LICENSE.upstream'), join(options.bundleRoot, 'LICENSE'))
  assert.equal(apply(options).applied, false)
  rmSync(join(options.bundleRoot, 'LICENSE'))
  writeFileSync(join(options.bundleRoot, 'LICENSE'), original)
  put(options.repoPath, '.AGENTS/skills/local.txt', 'case variant')
  assert.match(plan(options).conflicts.join('\n'), /Case collision/)
  assert.throws(() => inventory({ bundleRoot: options.bundleRoot, revision: '../escape' }), /40-character/)
})

test('ancestor bundle and consumer overlap is rejected', t => {
  const options = fixture(t)
  const child = join(options.bundleRoot, 'nested')
  mkdirSync(child)
  git(child, 'init', '-q')
  assert.match(plan({ ...options, repoPath: child }).conflicts.join('\n'), /overlap/)
})

test('ordinary write failure restores all original bytes even after a partial write', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.md', '# Original instructions\r\n')
  const before = snapshot(options.repoPath)
  let count = 0
  const result = apply(options, { write(path, content, flags) {
    if (++count === 4) { writeFileSync(path, 'partial write', flags); throw new Error('simulated disk failure') }
    writeFileSync(path, content, flags)
  } })
  assert.equal(result.applied, false)
  assert.match(result.conflicts.join('\n'), /original bytes were restored/)
  assert.deepEqual(snapshot(options.repoPath), before)
})

test('interrupted transaction fails closed and explicit recovery restores the prior bytes', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.md', '# Before\n')
  const entry = { path: 'AGENTS.md', before: Buffer.from('# Before\n').toString('base64'), after: Buffer.from('# After\n').toString('base64') }
  put(options.repoPath, 'AGENTS.md', '# After\n')
  put(options.repoPath, '.github/good-signal/transaction.json', JSON.stringify({ schema: 1, mode: 'repository', entries: [entry] }))
  assert.match(plan(options).conflicts.join('\n'), /Interrupted transaction/)
  assert.equal(recover({ repoPath: options.repoPath }).recovered, true)
  assert.equal(readFileSync(join(options.repoPath, 'AGENTS.md'), 'utf8'), '# Before\n')
})

test('recovery refuses subsequent edits and unsafe journal paths before restoring anything', t => {
  const options = fixture(t)
  put(options.repoPath, 'AGENTS.md', '# New local work\n')
  const journal = { schema: 1, mode: 'repository', entries: [{ path: 'AGENTS.md', before: Buffer.from('before').toString('base64'), after: Buffer.from('after').toString('base64') }] }
  put(options.repoPath, '.github/good-signal/transaction.json', JSON.stringify(journal))
  assert.throws(() => recover({ repoPath: options.repoPath }), /subsequent local edit/)
  journal.entries[0].path = '../outside.txt'
  put(options.repoPath, '.github/good-signal/transaction.json', JSON.stringify(journal))
  assert.throws(() => recover({ repoPath: options.repoPath }), /Unsafe|escapes/)
  assert.equal(readFileSync(join(options.repoPath, 'AGENTS.md'), 'utf8'), '# New local work\n')
})

test('community export writes defaults and licences without agent payload or instructions', t => {
  const options = { ...fixture(t), communityTarget: true }
  put(options.repoPath, 'README.md', '# Existing community repo\n')
  assert.equal(apply(options).applied, true)
  assert.equal(existsSync(join(options.repoPath, 'AGENTS.md')), false)
  assert.equal(existsSync(join(options.repoPath, '.agents')), false)
  assert.equal(existsSync(join(options.repoPath, '.claude')), false)
  assert.equal(readFileSync(join(options.repoPath, 'README.md'), 'utf8'), '# Existing community repo\n')
  assert.ok(existsSync(join(options.repoPath, '.github/ISSUE_TEMPLATE/bug.yml')))
  assert.ok(existsSync(join(options.repoPath, '.github/good-signal/LICENSE.upstream')))
  assert.equal(check(options).current, true)
})
