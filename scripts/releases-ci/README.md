# scripts/releases-ci

CI-only release scripts — intended to run from a CI workflow (CircleCI or GitHub Actions).

## Commands

For information on command arguments, run `node <command> --help`.

### `prepare-package-for-release.js`

Prepares files within the `react-native` package and template for the target release version. Writes a new commit and tag, which will trigger `publish-npm.js` in a new workflow.

### `publish-npm.js`

Prepares release artifacts and publishes the `react-native` package to npm.
