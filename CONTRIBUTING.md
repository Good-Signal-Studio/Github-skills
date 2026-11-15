# Contributing to Github-skills

Thank you for helping maintain these shared GitHub workflows. Useful changes
preserve project rules, keep upstream attribution and show repeatable evidence.

## Getting help

Use the [repository's issues](https://github.com/Good-Signal-Studio/Github-skills/issues)
for a question about an existing behaviour or a proposed change. Check the
[enrolment guide](docs/enrolment.md) before reporting an installation conflict.
Refusing to overwrite a local edit is intentional.

## Reporting issues

Search open and closed issues first. Include your OS, Node version, bundle commit,
the command, expected result and actual output. Remove private instruction text,
tokens and personal paths from plans before posting them. A plan includes current
instruction contents. Report a suspected vulnerability privately to the repository
owner through an existing private channel. Do not open a public issue containing
an exploit, secret or private project file. See [SECURITY.md](SECURITY.md).

## Setting up

Use Git, Python 3.13 or newer, and Node 22.18 or newer, or Node 24.2 or newer.
CI runs Node 24 and Python 3.13. The scripts use standard libraries. No package
installation or build is required. `gh` is needed only for the skills' GitHub
operations.

```sh
git clone https://github.com/Good-Signal-Studio/Github-skills.git
cd Github-skills
node scripts/test.mjs
```

The runner tests canonical Node files and the Python watcher once each, then
checks the installed content against HEAD. Commit changes before the full run.
It passes sorted explicit test paths and excludes installed `.agents` and
`.claude` copies. Those generated copies remain tracked and checked for drift.

## Making a change

Read [AGENTS.md](AGENTS.md). Agree on large changes in an issue before coding.
Create a task branch from `origin/dev` in an isolated worktree. Keep one writer
per worktree. Update behaviour tests and docs with changes to file ownership,
instruction discovery, template precedence or recovery. Do not add an overwrite
bypass. Keep source changes visible against [UPSTREAM.md](UPSTREAM.md) and the
[upstream manifest](upstream-manifest.json).

## Running tests

```sh
node scripts/test.mjs
```

This is the complete local and [CI](.github/workflows/ci.yml) command. The runner
reports all three phases and total elapsed time, with a nonzero exit if any phase
fails. [Testing](docs/testing.md) covers focused runs and content sync. Strict
enrolment `check` still requires the recorded revision to match. `check-content`
allows only that revision field to differ when the complete managed content and
all other manifest metadata match. Neither check rewrites the recorded pin.

CI declares Linux and Windows jobs.
Billing currently prevents hosted Actions runs as reported by the owner on
2026-11-15. Record local results and actual versions. Do not call hosted CI green
without a successful run. Runtime discovery, public GitHub fallback and independent
review require separate evidence beyond unit tests.

## Commit messages

Write one logical change per commit. Use a short imperative subject, explain
material limits in the body, and finish with `Task:`, `Agent:` and `Agent-Session:`
trailers. Stage named paths and inspect the staged diff. Never commit `.audit`,
private receipts, transcripts, credentials or environment values.

## Pull requests

Target `dev`. Use the project's PR template and attach commands and results for
the exact proposed head. State the upstream copy and adaptation boundaries.
Publication needs the owner's approval. A session that did not build the change
must verify the exact head before merge. Record missing independent review as a
blocker. Task PRs squash into `dev`. Promotion to the current production branch
`main` uses a merge commit. Every merge waits for Jeff's approval.

## AI-assisted contributions

AI tools may assist. Contributors own every submitted line and must understand
the changes, disclose the actual tool and review performed, and distinguish
observed results from assumptions. Never claim a reviewer or test run that did
not happen. Preserve both MIT notices when redistributing copied skills.

## Code of conduct

Treat contributors with respect. Keep reports factual and avoid personal attacks.
Use an existing private channel to the repository owner for conduct concerns.
This repository has no separate adopted code of conduct or promised response time.

## Signing your work

No separate DCO or CLA has been adopted here. Do not add a legal attestation on
someone else's behalf.
