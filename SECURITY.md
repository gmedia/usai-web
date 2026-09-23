# Security policy

## This website

`usai-web` is a static site: no server, no user accounts, no forms that store data. Relevant reports include:

- a vulnerable dependency that reaches the built output;
- a way to inject content into the built pages (for example through the build pipeline or a GitHub Actions workflow);
- a compromised or mis-pointed domain or asset (`usai.sakala.dev`, `public/CNAME`).

Report these through GitHub's **private vulnerability reporting** on this repository (Security → Report a vulnerability). Maintainers acknowledge within 7 days. There is no bounty.

## The Usai runtime

Vulnerabilities in the runtime belong in [gmedia/usai](https://github.com/gmedia/usai/security). Follow that repository's [SECURITY.md](https://github.com/gmedia/usai/blob/main/SECURITY.md) for scope. Note that execution worlds are *semantic isolation*, not a sandbox for hostile code.
