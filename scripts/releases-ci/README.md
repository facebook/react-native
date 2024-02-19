# scripts/releases-ci

CI-only release scripts — intended to run from a CI workflow (CircleCI or GitHub Actions).

## Commands

For information on command arguments, run `node <command> --help`.

### `publish-updated-packages`

Publishes all updated packages (excluding `react-native`) to npm. Triggered when a commit on a release branch contains `#publish-packages-to-npm`.
