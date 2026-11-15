# Testing the bundle

Verified against the runner on 2026-11-15. From a clean committed checkout, run:

```sh
node scripts/test.mjs
```

Git, Node and Python must be available. CI uses Node 24 and Python 3.13. The tests
use standard libraries and need no package installation. The runner reports each
phase and total elapsed time. Any failed phase makes the command exit nonzero.
Independent phases still run after a test failure.

## What the command checks

The Node phase passes sorted explicit `.test.mjs` paths from root `scripts/` and
each canonical skill's `scripts/` to Node's built-in test runner. It excludes
dotfolders, so tests in installed `.agents` and `.claude` copies do not run again.
The suites cover enrolment ownership and rollback, PR body and review evidence,
documentation and README checks, repository standards, discussion and issue
guidance, commit policy and review gates. Enrolment uses local Git fixtures.

The Python phase runs `python -m unittest -v` once from `babysit-pr/scripts/`.
It covers PR watcher state, review and check decisions, retry and exit behaviour.
The runner does not contact GitHub or execute the installed skill copies.

The final phase checks the committed repository's generated snapshots against
the current HEAD through the public enrolment content check. It compares every
selected source file, copied file, licence, mode and managed instruction block.
It validates the complete manifest metadata while allowing only the recorded
`bundle.revision` to differ. The output shows both revisions and both verdicts.
Root installer, test-runner and documentation commits can therefore pass content
sync without silently advancing a payload pin. That pass does not certify that
the commits contain identical tooling. Strict `check` still requires the pin
itself to match. See [enrolment checks](enrolment.md#plan-apply-and-check).

## Focused checks during an edit

Targeted tests can run before committing:

```sh
node --test scripts/enrol.test.mjs
node --test pr-template/scripts/pr-body.test.mjs
```

For the watcher alone, run `python -m unittest -v` from `babysit-pr/scripts/`.
These commands do not replace the full command on the committed head. A dirty
tracked checkout fails the final content phase because it is not the pinned Git
source. Review source and generated changes together when updating payloads.

Keep tests with distinct contracts. In particular, the PR body suite intentionally
runs its inner tests again to verify fixture cleanup. That nested run is not a
second invocation by the top-level runner. Windows skips permission cases that
need POSIX modes. Linux CI supplies that coverage when hosted runs are available.
