# Deploying the demo

`pnpm build:demo` produces a standalone site in `demo-dist`. It includes React and
uses relative asset URLs so it can be hosted under `/react-sticky-kit/` without a
custom base-path rebuild. Hash navigation requires no server-side route fallback.

## Initial static preview

A `gh-pages` branch contains the prepared static demo. A repository administrator
can enable it under **Settings → Pages → Deploy from a branch**, selecting
`gh-pages` and `/ (root)`. GitHub's initial build must finish before advertising
`https://oe.github.io/react-sticky-kit/` as an available demo.

The maintenance integration cannot enable the site: GitHub returned HTTP 403,
“Resource not accessible by integration.” Generating the branch does not itself
make the URL live.

## Subsequent releases through GitHub Actions

After merging the demo workflow, choose **GitHub Actions** as the Pages source
under repository settings. Run **deploy demo** from the Actions tab on `main`.
The workflow builds the current source, uploads only `demo-dist`, and deploys the
artifact. It is manually dispatched so documentation changes do not unexpectedly
publish a new site. GitHub environment protection rules may require approval.

Once the first deployment is verified, use its URL as the repository/npm homepage
and the README's main demo link. Metadata changes reach npm with the next package
release; the package version is intentionally unchanged in this documentation PR.
