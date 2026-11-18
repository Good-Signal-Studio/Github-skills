# Good Signal Studio community defaults

This directory contains issue forms and a PR template derived from the pinned
Jeff-Kazzee/github-skills snapshot recorded in the parent UPSTREAM.md. Preserve
LICENSE.upstream and LICENSE when copying it.

It is ready for review before publication to the default branch of the public
Good-Signal-Studio/.github repository. That repository has not been created by
this work, so organisation fallback is not active from this directory alone.
Existing project templates win. Any local ISSUE_TEMPLATE directory or config
suppresses the entire organisation issue-template fallback.

GitHub does not inherit AGENTS.md, Claude instructions, skills or workflows from
this community repository. Enrol repositories explicitly for agent defaults.
The parent scripts/enrol.mjs supports a --community-target mode that copies only
missing GitHub templates plus provenance and licences into an existing checkout.
