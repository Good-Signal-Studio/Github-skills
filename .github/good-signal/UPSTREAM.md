# Upstream provenance

On 2026-11-17 the personal repository's `dev` branch pointed to
[`649e340019a49f29d27bc940f0822d2c815dff8e`](https://github.com/Jeff-Kazzee/github-skills/tree/649e340019a49f29d27bc940f0822d2c815dff8e).
The source manifest inventories all 87 tracked files by path, Git mode, blob ID,
SHA-256 and byte length. The 13 skill directories contain 83 files, including
all references, scripts, tests and fixtures. All 83 files retain their original
bytes and Git modes.

## Worked example

`pr-template/references/example.md` is the personal repository's adaptation of
[Orca PR #37557](https://github.com/stablyai/orca/pull/37557) by Dave Fano. The
agency copies the personal file byte for byte, including the screenshot request.
The [Orca repository's MIT licence at the merge commit](https://github.com/stablyai/orca/blob/295b828bd1ea38233a63d0e9f3c63ac17ffd9528/LICENSE)
and [GitHub's terms for contributions to licensed repositories](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#6-contributions-under-repository-license)
are the basis for the notice below. If you copy the example on its own, carry
the credit and notice with it.

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
the licence notices. Their installed manifest records the agency payload revision
separately from the personal source revision.

## Orca MIT licence notice

```text
MIT License

Copyright (c) 2026 Lovecast Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
