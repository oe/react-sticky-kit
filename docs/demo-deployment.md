# Deploying the demo

For a snapshot built before merge, set `VITE_DEMO_SOURCE_REF` to its pushed commit
SHA so source links resolve to that snapshot. The default is `main`.

`pnpm build:demo` produces a standalone site in `demo-dist`. It includes React and
uses relative asset URLs so it can be hosted under `/react-sticky-kit/` without a
custom base-path rebuild. Hash navigation requires no server-side route fallback.

## Published demo

The live demo is available at **https://app.evecalm.com/react-sticky-kit/**.
GitHub Pages serves the generated `gh-pages` branch from `/ (root)`. The HTTPS
page and all eight example routes have been verified in Chromium at mobile width.
Users can open a specific example directly with `#replace`, `#stack` or
`#mixed-mode`; no installation or code editor is required.

The deployed branch is a static snapshot. Source changes in a PR do not update
it automatically. Use the workflow below for subsequent deployments after merge.

## Subsequent releases through GitHub Actions

After merging the demo workflow, choose **GitHub Actions** as the Pages source
under repository settings. Run **deploy demo** from the Actions tab on `main`.
The workflow builds the current source, uploads only `demo-dist`, and deploys the
artifact. It is manually dispatched so documentation changes do not unexpectedly
publish a new site. GitHub environment protection rules may require approval.

The README and package homepage point to the verified live demo. Metadata changes
reach npm with the next package
release; the package version is intentionally unchanged in this documentation PR.
