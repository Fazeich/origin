# GitHub Pages deployment

Origin uses its own `Fazeich/origin` repository. Source lives on `main`; only generated production assets are published to `gh-pages`. Public URL: https://fazeich.github.io/origin/ . No portfolio deployment or source files are replaced.

`npm run deploy` runs the production build and `gh-pages -d dist --dotfiles`. The gh-pages npm package uses the repository's `origin` remote and normal Git credentials. No access token is stored in source or package configuration. Vite's relative base preserves asset and module-worker loading under `/origin/`. `public/.nojekyll` is copied into dist and published with dotfiles enabled.

GitHub repository Settings → Pages uses Deploy from a branch, branch `gh-pages`, folder `/`. Initial setup can also use the authenticated GitHub Pages REST API with that branch/path. GitHub may take a short time to publish after the branch push. There is no custom Actions workflow or automatic deploy on source push.

Before updates: lint, typecheck, tests and production build. `npm run test:production` checks local static output. To run the same real browser checks on the public site in PowerShell:

```powershell
$env:ORIGIN_SMOKE_URL = 'https://fazeich.github.io/origin/'
npm run test:production
Remove-Item Env:ORIGIN_SMOKE_URL
```

Remote checks cover WebGL startup, worker assets, mouse capture, movement, LMB mesh rebuilding, pause/resume and absence of the development bridge. They use a temporary browser session and do not persist world edits. Results are written to `docs/validation/deployment.json`. Initial publication is only considered verified once that check passes.
