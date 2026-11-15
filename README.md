# Github-skills
Good Signal Studio's Github Skills, templates for great Github etiquette.


Shared GitHub skills for Codex and Claude Code, with pinned project snapshots.
The original description above is retained from the organisation repository.

## Features

- Preserve each project's branch, test, dependency and security instructions.
- Plan installation before it writes, then record exact source and file hashes.
- Keep complete skills, sibling imports, references, fixtures and licence notices.
- Refuse local collisions and edited managed files during updates.
- Supply issue and PR defaults ready for a separately approved community rollout.

## Quick start

Use Git and Node 22.18 or newer, or Node 24.2 or newer. The scripts use standard
libraries and need no package install. Clone this repository and inspect a plan
for an existing target checkout. Replace the target path for your machine.

```sh
git clone https://github.com/Good-Signal-Studio/Github-skills.git
cd Github-skills
git rev-parse HEAD
node scripts/enrol.mjs plan --repoPath /work/my-project --bundleRoot . --revision <full-SHA-from-the-previous-command>
```

The plan is read-only. It displays existing instructions, intended files, skips
and conflicts. Apply that reviewed revision with `apply` in place of `plan`, then
use `check`. A real full commit is required and tracked bundle files must be clean
for apply. Commit the consumer's changes after review. See
[enrolment and recovery](docs/enrolment.md) for Windows paths, updates and rollback.
Strict `check` requires a matching revision pin. Read-only `check-content` can
confirm identical managed content across commits that change only root tooling
or documentation. It compares all manifest metadata except `bundle.revision` and
keeps the recorded pin intact.

## Examples

After enrolment, ask Codex or Claude to use `pr-template` for a pull request draft.
The project's existing instructions and PR template remain authoritative. To check
a draft body offline, run this from the enrolled project:

```sh
node .agents/skills/pr-template/scripts/pr-body.mjs check body.md --head <full-project-head-SHA>
```

The checker verifies structure and declared evidence. It cannot prove claims are
true. `--render` sends the entire body to GitHub and needs separate approval.
Evidence uploads also need approval. Documentation checkers with `--clone` execute
document commands and are for explicitly approved sandbox verification only.

Claude users can instead choose the optional native plugin. See the commands and
the duplicate-discovery warning in [enrolment](docs/enrolment.md#optional-claude-plugin).
The optional plugin has not been runtime-validated here. Publishing its marketplace
does not install or enable it, and it changes no global settings by itself.

## Documentation

[The architecture](docs/architecture.md) describes inventory, ownership and safe
updates. [Enrolment](docs/enrolment.md) covers plan, apply, checks, refusal, recovery
and community export. [Testing](docs/testing.md) explains the single local and CI
command and its coverage. Facts below were checked against this tree on 2026-11-15.

| Folder | Contents |
| --- | --- |
| `babysit-pr/` | Watch checks and review feedback for an existing PR |
| `commit/` | Commit and merge-message guidance |
| `contributing/` | Contribution-guide templates and checks |
| `discussions/` | Discussion drafts, templates and lint |
| `issues-and-releases/` | Issue triage and release documentation |
| `pr-template/` | PR body guidance, evidence workflow and offline checker |
| `readme/` | README templates, images and link checks |
| `repo-docs/` | Documentation structure, page templates and link checks |
| `repo-standards/` | Repository audit, gates and nine starter templates |
| `review-comments/` | Evidence-backed review-comment drafts and lint |
| `review-gate/` | Risk floor and independent-review requirements |
| `scripts/` | Offline enrolment, recovery and cross-platform test runner |
| `defaults/` | Shared policy that defers to each project's rules |
| `community/` | GitHub issue and PR defaults ready for separate publication |
| `.claude-plugin/` | Optional Claude marketplace and plugin manifests |

The eleven skill folders are imported in full. The inventory is derived from their
root `SKILL.md` files. Companion skills such as `council`, `interrogate`,
`code-review`, `technical-writing`, `unslop`, `storybrand-design`, `domain-modeling`,
`hill-climb` and a project's verify skill are not included. Drafting has a plain
fallback in each skill. Required independent review stays blocked when its
capability is unavailable. Passing tests do not replace that review.

GitHub operations in the skills need an authenticated `gh` CLI. The Python PR
watcher uses the Python standard library. CI declares Python 3.13 and Node 24.
Local verification must record the versions actually used. Neither Python nor
`gh` is required by enrolment.

Organisation GitHub fallback requires files on the default branch of a separate
public `Good-Signal-Studio/.github` repository. This work has not created that
repository or activated fallback. Publication awaits approval. Existing project
templates win, and any local issue configuration suppresses the entire default
issue set. GitHub does not inherit skills, AGENTS.md or workflows from that repo.
Current and new projects need explicit agent enrolment. Managed enterprise
provisioning needs separate Codex or Claude administrator access.

## Contributing

Run the complete checks from a clean committed head with Git, Node and Python:

```sh
node scripts/test.mjs
```

The runner tests the canonical Node files, tests the Python watcher and checks
committed content sync once each. It reports each result and total elapsed time.
Generated copies remain tracked and checked, but their tests are not rerun.

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests and the review process.
Maintain this README when the inventory, commands or deployment behaviour changes.
Update the upstream pin through a reviewed task PR, retain both licences, rerun
the complete suite and inspect every source change. Keep provenance exceptions
visible in [UPSTREAM.md](UPSTREAM.md).

## License

MIT. The organisation's original [LICENSE](LICENSE) is preserved. The imported
source's [LICENSE.upstream](LICENSE.upstream) is preserved verbatim and copied to
consumers alongside the organisation notice. [UPSTREAM.md](UPSTREAM.md) and the
[source manifest](upstream-manifest.json) record the upstream commit and blob hashes.
Source history was not imported. This is not an independent audit of every third
party's rights in the upstream repository.

The upstream Orca worked example has unresolved original attribution and is not
republished. Its path now holds an original, labelled organisation illustration.
This exception remains open and is documented in [UPSTREAM.md](UPSTREAM.md).
