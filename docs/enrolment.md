# Enrolling a repository

Verified against the implementation on 2026-11-15. Use a local Git checkout of
this bundle and a separate existing target checkout. A newly initialised Git
repository is supported. Node 22.18 or newer, or Node 24.2 or newer, and Git are
required. Python and `gh` are not needed by enrolment.

## Plan, apply and check

Use the same full bundle revision for each command. The revision is the bundle's
own commit, not its upstream source pin. These are example paths and a placeholder
revision. Replace them with your checkout paths and the output of `git rev-parse HEAD`.

```sh
node scripts/enrol.mjs plan --repoPath /work/project --bundleRoot /work/Github-skills --revision <full-bundle-SHA>
node scripts/enrol.mjs apply --repoPath /work/project --bundleRoot /work/Github-skills --revision <full-bundle-SHA>
node scripts/enrol.mjs check --repoPath /work/project --bundleRoot /work/Github-skills --revision <full-bundle-SHA>
node scripts/enrol.mjs check-content --repoPath /work/project --bundleRoot /work/Github-skills --revision <full-bundle-SHA>
```

`plan`, `check` and `check-content` do not write files. Their JSON includes current
root instructions, proposed paths, skipped templates and conflicts. `check` exits
nonzero when a conflict or any pending change exists. `apply` requires a clean
tracked bundle checkout whose HEAD equals the requested full commit. Each copied
file must match the pinned Git blob. Untracked files are never copied.

`check` is strict. A different recorded bundle revision is a pending manifest
update even when all payload bytes match. Use it to check adoption of a specific
pin. `check-content` checks content across revisions without advancing that pin.
It requires clean tracked source at the requested full commit and runs the same
complete plan. It accepts no pending operations, or one manifest update whose
parsed JSON differs only in `bundle.revision`. The recorded revision must also
be a full 40-character SHA. No other manifest field is ignored.

The content result reports `contentCurrent`, `revisionCurrent`, `recordedRevision`
and `checkedRevision` separately. A content pass can accompany a revision mismatch.
It does not mean the commits have identical installer or test code. Conflicts,
changed files, licences, permissions, path inventories, metadata, managed
instruction blocks and interrupted transactions still fail. `check-content`
exits nonzero when content is not current and never rewrites the manifest.
The [full test command](testing.md) uses this check on the repository's own
committed snapshots. Use strict `check` for a consumer's exact adopted revision.

The installer discovers skills from tracked root `SKILL.md` files. It copies the
complete sibling skill folders, including references, scripts, tests and fixtures,
into both `.agents/skills/` and `.claude/skills/`. Sibling imports remain valid.
Git executable modes are retained for copied launchers. Both MIT notices go beside
each skill. Source and licence records also go into
`.github/good-signal/`. Enrolment executes no copied scripts, document commands,
network fetches, package installs or GitHub operations. Its only external command
is Git for read-only local source inspection.

## Existing work and instructions

Existing project files win. New files never overwrite unowned files. A collision
anywhere blocks the complete operation before it writes. Symlinks, junctions,
traversal, case collisions and ancestor overlap are refused. Self-enrolment into
the exact bundle checkout is supported because source skills and installed skill
paths are disjoint. Use one writer and stop other edits during an apply.

The installer appends a bounded reference to root `AGENTS.md`, preserving every
existing byte. It appends a bounded `@AGENTS.md` import to `CLAUDE.md` only when an
active import is absent. Examples inside backtick or tilde code fences do not
count as active imports. An unclosed fence in an existing `CLAUDE.md` stops
enrolment for manual review before any writes. Existing instructions outside the
managed block can change freely. The manifest compares the block itself on
updates. An edited or removed managed block requires manual reconciliation. It
is never replaced silently.

A root `AGENTS.override.md` is an explicit conflict because Codex can select it
instead of `AGENTS.md`. Review that override and add the shared reference using
the project's own process before retrying. The installer does not claim its
defaults are active while that bypass exists. Nested project instructions and
runtime configuration can further affect what an agent loads. Inspect the
runtime's discovered skill list before relying on a particular deployment.

All existing issue-template directories suppress the complete default issue set,
including a directory that contains only `config.yml`. Root, `.github/` and
`docs/` PR templates, including `.md`, `.txt`, extensionless files and a
`PULL_REQUEST_TEMPLATE` directory, suppress the default PR template. Enrolment
installs missing issue and PR templates only. It does not install the example CI,
security policy, CODEOWNERS or full AGENTS template.

## Updates and rollback

Commit the consumer's installed files after review. To update, check out a new
clean bundle revision, plan, and apply that full revision. The previous manifest
owns individual paths and records their SHA-256 hashes. An owned file updates
only if its current hash equals the previously installed hash. Local edits,
locally removed files and extra files inside an installed skill directory are
conflicts. There is no force option. Removed upstream files are also a conflict
that requires explicit reconciliation. Copy local customisations outside the
managed directories before adopting a new snapshot.

Ordinary write failures restore the saved previous bytes and remove newly created
files and empty directories. Each successful write gets a hash readback. The
transaction is not atomic across multiple files. An interrupted process leaves
`.github/good-signal/transaction.json` with the before and after bytes. Subsequent
applies stop. Inspect that journal and any working-tree changes, then run:

```sh
node scripts/enrol.mjs recover --repoPath /work/project
```

Recovery preflights all entries and restores the prior state only when each file
still matches its before or after bytes. It refuses subsequent local edits. Empty
directories can remain after interrupted recovery. Keep the journal private
because it includes the prior instruction bytes. Once a change is committed,
normal Git review and revert can restore the recorded snapshot. A revert cannot
undo a skill's later external actions.

## Organisation community export

The `community/` tree is ready for a separate public
`Good-Signal-Studio/.github` repository. That repository has not been created by
this work. Export into an approved existing checkout using the same plan and
apply commands with `--community-target`. This mode writes only missing GitHub
issue and PR defaults plus licence and provenance files. It writes no agent
payload or instructions and preserves existing templates.

GitHub uses organisation defaults only after the files exist on that public
repository's default branch. A local issue configuration suppresses the entire
organisation issue-template set. GitHub does not inherit AGENTS.md, Claude
instructions, skills or workflows through the `.github` community repository.
New repositories need explicit agent enrolment. GitHub administration does not
provision Codex or Claude enterprise runtimes. That needs separate runtime
administrator access and a separately reviewed rollout.

## Optional Claude plugin

Claude users can choose the snapshot route or the optional native plugin route
for a project. Avoid loading both copies of these skills. Snapshot enrolment
deliberately supplies both agent directories and has no plugin-install flag.
For a plugin-only Claude project, use the plugin instead of running full snapshot
enrolment, or review a project-specific deployment that keeps only Codex copies.
Codex has no plugin manifest in this bundle and uses `.agents/skills/` snapshots.

```sh
claude plugin validate .
claude plugin marketplace add Good-Signal-Studio/Github-skills
claude plugin install gss-github@good-signal-studio --scope project
claude plugin list
```

These commands require a compatible installed Claude CLI and the published
marketplace. Local manifest validation passed with warnings on 2026-11-15. The
optional plugin's runtime discovery has not been exercised here.
The marketplace manifest alone does not install or enable anything. A plugin's
CLAUDE.md is not standing project context. This repository's installer changes no
global settings, profiles or security controls.
