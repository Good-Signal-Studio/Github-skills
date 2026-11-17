# Upstream provenance

On 2026-11-17 the personal repository's `dev` branch pointed to
[`649e340019a49f29d27bc940f0822d2c815dff8e`](https://github.com/Jeff-Kazzee/github-skills/tree/649e340019a49f29d27bc940f0822d2c815dff8e).
The source manifest inventories all 87 tracked files by path, Git mode, blob ID,
SHA-256 and byte length. The 13 skill directories contain 83 files, including
all references, scripts, tests and fixtures. All 83 Git modes match. Of those
files, 82 retain the original bytes.

## Worked example

The sole replacement is `pr-template/references/example.md`. Its upstream blob
is `4d6c07f9d16342cacc0597b30448842aceead14d`. The upstream file reproduces a
worked Orca PR about retaining manual sidebar order when grouping primary
checkouts and linked worktrees by repository. It runs from the introductory
note through the PR checklist. The source describes the example as kept as
written. Third-party attribution for the reproduced PR remains unresolved.
All three trees retain the existing fictional Good Signal Studio enrolment
example, blob `2c43fde4dd74cc2ccb9ac04ab0b05c590a625dc1`.

## Agency integration

The agency README retains its branch, review and approval policy. Its own
gitignore and CI serve this repository. The two MIT notices remain verbatim.
LICENSE.upstream contains the personal repository's licence. Source history
was not imported.

The installer, community export, templates, project instructions, documentation
and Claude plugin metadata belong to the agency integration. Project instructions
and defaults/DEFAULTS.md govern use of upstream examples that name personal
accounts, environments or other skills. The upstream checker and its templates
retain their original repository identities. Review those settings before adopting
them in another project. Both runtimes receive complete local skill copies and
the two licence notices. Their installed manifest records the agency payload
revision separately from the personal source revision.
