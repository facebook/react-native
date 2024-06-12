# scripts/releases

Scripts related to creating a React Native release. These are the lower level entry points used by [**scripts/releases-ci**](https://github.com/facebook/react-native/tree/main/scripts/releases-ci).

## Commands

For information on command arguments, run `node <command> --help`.

### `remove-new-arch-flags`

Updates native build files to disable the New Architecture.

### `set-version`

Sets a singular version for the entire monorepo (including `react-native` package)

### `set-rn-version`

Updates relevant files in the `react-native` package and template to materialize the given release version.

### `update-template-package`

Updates workspace dependencies in the template app`package.json`

### `validate-version`

Takes a version and a build type and validates whether the version passed is valid for the given build type
It is intended to use in CI

### `compute-npm-tag`

Takes a version, a branch and whether we want to explicitly tag the release as "latest" and outputs the most appropriate NPM tag for the release.
