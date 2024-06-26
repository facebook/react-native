# scripts/releases

Scripts related to creating a React Native release. These are the lower level entry points used by [**scripts/releases-ci**](https://github.com/facebook/react-native/tree/main/scripts/releases-ci).

## Commands

For information on command arguments, run `node <command> --help`.

### `create-release-commit`

Creates a release commit to trigger a new release.

### `remove-new-arch-flags`

Updates native build files to disable the New Architecture.

### `set-version`

Sets a singular version for the entire monorepo (including `react-native` package)

### `set-rn-version`

Updates relevant native files in the `react-native` package to materialize the given release version. This is run by `set-version` unless `--skip-react-native-version` is passed.
