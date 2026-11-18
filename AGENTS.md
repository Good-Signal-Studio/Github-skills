# Github-skills

Good Signal Studio's pinned GitHub skills, templates and enrolment tools.

## Git policy

This repository follows Jeff's Git law from `~/AGENTS.md` for agents
running on his machine. Other contributors follow the same repository policy
without needing that private file. Use one task, one branch, one worktree and one
writer. Create `task/<id>-<slug>` from `origin/dev`. Task PRs target `dev` and use
a squash merge after Jeff approves the exact reviewed head. The existing `main`
branch serves as the production branch until an approved rename. Promotion from
`dev` to `main` uses a merge commit and requires Jeff's approval. Never push directly
to `dev` or `main`. Do not rename branches or change protections as a side effect.

Every commit ends with `Task:`, `Agent:` and `Agent-Session:` trailers. Keep private
audit evidence, transcripts and credentials out of commits. Publication and merges
require Jeff's approval. Required independent verification must run in a session
that did not build the change. Passing unit tests is not that independent verdict.

## Commands and dependencies

Run `node scripts/test.mjs` from a clean committed head. This same local and CI
command runs canonical Node tests, Python watcher tests and committed content
sync once each. See `docs/testing.md` for targeted checks and the difference
between content sync and a matching revision pin. CI uses Node 24 and Python
3.13. Local evidence must name the actual versions. The scripts use Node and
Python standard libraries. No package installation is needed. Git is needed for
source verification and fixture creation.
GitHub operations in skills need an authenticated `gh` CLI. Enrolment is offline
and uses only read-only local Git commands to verify the pinned source.

## Maintenance

Keep the licence notices verbatim. Record upstream provenance in `UPSTREAM.md`.
Carry the Orca credit and licence notice with the worked PR example.
Change the installer and its tests together. Never bypass a collision or use a
force flag to overwrite an existing project's work. Read `docs/enrolment.md`
before changing ownership, instruction blocks or transaction recovery.

<!-- good-signal-studio:defaults:start -->
Read `.github/good-signal/DEFAULTS.md` for the shared organisation defaults.
This repository's branch, test, dependency, security and approval rules take precedence.
Skills are available in `.agents/skills/` for Codex and `.claude/skills/` for Claude.
<!-- good-signal-studio:defaults:end -->
