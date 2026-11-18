# Portable pinned snapshots

The accepted design uses one inventory derived from root skill folders. A second
design used runtime-native plugins and generated links. Snapshots were chosen
because Codex and Claude have supported repository skill paths, while links can
need Windows privileges and plugins need per-user runtime setup. The cost is two
payload copies per consumer and explicit updates. The optional Claude marketplace
is an alternative deployment route.

`inventory` verifies a local bundle commit and returns skills, complete source
files and stable hashes. `plan` combines that inventory with a consumer's current
manifest and files. It returns instruction readback, proposed changes, skips and
conflicts. `apply` repeats preflight with a clean tracked source requirement,
records a recovery journal, writes the plan, checks the written hashes and removes
the journal. `check` is a read-only plan with a current-state verdict. `recover`
restores an interrupted operation after validating every entry.

Ownership is per file, plus bounded blocks for root instructions. The manifest
records bundle and upstream revisions separately. Shared policy lives in one
installed `DEFAULTS.md`. Project instructions retain authority. All consumers use
the same registry and materialisation path. There is no background provisioner,
network resolver, force override or global configuration writer.
