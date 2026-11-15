# Upstream provenance

Imported on 2026-11-15 from the public repository
https://github.com/Jeff-Kazzee/github-skills at the full commit
`8ce6fda01a1cca24b20a406e3efd8f087bf70264` on its `prod` branch.
The import copied the snapshot without importing source history.

`upstream-manifest.json` records all 83 source paths, Git blob IDs, SHA-256 hashes
and byte lengths before adaptations. It covers the complete source tree, including
the source root README, gitignore and CI. All eleven root skill folders were copied
in full, including scripts, references, tests and fixtures. The source README and
gitignore were not adopted as root files. The destination's original two README
lines and its original licence remain. CI was imported and extended to include
enrolment tests. The source MIT licence is preserved verbatim as LICENSE.upstream.

## Attribution exception

`pr-template/references/example.md` originally contained a long Orca passage
described as kept as written. Its original third-party attribution has not been
verified. That passage is not republished. The file was replaced with an original,
clearly labelled imaginary organisation example. This exception remains unresolved
for anyone who wants to restore the original passage. Preserve this warning in
rollout records and later imports.

The source's MIT notice establishes its declared licence. It is not an independent
third-party ownership audit of every passage or reference. Reference documents and
their source URLs are retained. No ownership is claimed over the external works
they cite.

## Portability adaptations

- The PR skill defers to the consuming repository's instructions and template.
- Active verification routes use the project's approved environment. Machine-specific
  Linveo and Daytona instructions were removed from active skills.
- External drafting and review skills are optional integrations. Drafting has a plain
  fallback. Required independent reviews remain blocked when unavailable.
- The checker identity and workflow templates use Good-Signal-Studio/Github-skills.
  The trusted human Jeff-Kazzee remains unchanged in the risk-floor rules.
- CODEOWNERS uses the valid human account @Jeff-Kazzee. The AGENTS starter is portable
  and does not impose a universal home instruction file or branch naming scheme.
- Template fetches retain full-SHA requirements. Snapshot deployment is documented
  alongside checker fetches. Upload approval and whole-body rendering warnings remain.
- The CI test runner expands explicit test paths on Windows and excludes copied
  runtime payloads, so self-enrolment does not multiply the root test suite.
- The Python `pr-wait` launcher is marked executable in the organisation bundle.
  The three upstream executable modes are retained. Installed copies carry those
  modes and record them in their manifest. Git attributes preserve source bytes.

Adapted source paths are listed below. The exact changes are reviewable against
the original blob IDs and hashes in the source manifest.

- `.github/workflows/ci.yml`.
- `babysit-pr/SKILL.md`.
- `commit/SKILL.md`.
- `contributing/SKILL.md`.
- `discussions/SKILL.md`.
- `issues-and-releases/SKILL.md`.
- `pr-template/SKILL.md`.
- `pr-template/references/evidence.md`.
- `pr-template/references/example.md`.
- `readme/SKILL.md`.
- `repo-docs/SKILL.md`.
- `repo-standards/SKILL.md`.
- `repo-standards/references/checklist.md`.
- `repo-standards/references/templates/AGENTS.md`.
- `repo-standards/references/templates/CODEOWNERS`.
- `repo-standards/references/templates/skills-check.yml`.
- `repo-standards/scripts/repo-check.mjs`.
- `repo-standards/scripts/repo-check.test.mjs`.
- `review-comments/SKILL.md`.
- `review-gate/SKILL.md`.

## Organisation additions

The installer, its behavioural tests, root project instructions, policy, docs,
contribution guide, optional Claude manifests and community export are organisation
additions. Generated per-repository snapshots are declared in their installed
manifest with a distinct full bundle revision and SHA-256 file hashes. Preserve
both notices when redistributing those snapshots.

The community forms and PR template are byte copies of the retained source
templates. The community repo has not been created or activated by this work.
Publication requires separate approval. No credentials, transcripts, environment
files or private audit material are part of the import. A pre-publication scan of
the final candidate is still required after later edits.
