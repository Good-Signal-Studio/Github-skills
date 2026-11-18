import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const upstream = JSON.parse(readFileSync(new URL('../upstream-manifest.json', import.meta.url)))

test('all pinned skill paths, Git modes and blobs survive in each committed tree', () => {
  const skills = upstream.files.filter(file => /^[^/]+\/SKILL\.md$/.test(file.path))
    .map(file => file.path.split('/')[0])
  const files = upstream.files.filter(file => skills.includes(file.path.split('/')[0]))
  assert.equal(skills.length, 13)
  assert.equal(files.length, 83)
  const output = execFileSync('git', ['ls-tree', '-r', 'HEAD'], { cwd: root, encoding: 'utf8' })
  const tree = new Map(output.trimEnd().split('\n').map(line => {
    const [metadata, path] = line.split('\t')
    return [path, metadata]
  }))
  for (const prefix of ['', '.agents/skills/', '.claude/skills/']) {
    for (const file of files) {
      const path = prefix + file.path
      assert.equal(tree.get(path), file.gitMode + ' blob ' + file.gitBlob, path)
    }
    const expectedPaths = files.map(file => prefix + file.path)
    if (prefix) {
      for (const skill of skills) {
        for (const license of ['LICENSE', 'LICENSE.upstream']) expectedPaths.push(prefix + skill + '/' + license)
      }
    }
    const actualPaths = [...tree.keys()].filter(path => prefix ? path.startsWith(prefix) : skills.includes(path.split('/')[0]))
    assert.deepEqual(actualPaths.sort(), expectedPaths.sort())
  }
})
