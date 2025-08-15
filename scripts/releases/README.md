# scripts/releases

Scripts related to creating a React Native release. These are the lower level entry points used by [**scripts/releases-ci**](https://github.com/facebook/react-native/tree/main/scripts/releases-ci).

## Commands

For information on command arguments, run `node <command> --help`.

### `create-release-commit`

Creates a release commit to trigger a new release.

### `set-version`

Bump the version of all packages.

- Updates `package.json` metadata for all workspaces and the project root.
- Updates relevant native files in the `react-native` package.

If `--skipReactNativeVersion` is passed, the `react-native` package version will be left unmodified as `"1000.0.0"` (special static version on `main`), and native files will not be touched.

### `set-rn-artifacts-version`

> [!Note]
> **Deprecated**: Prefer `set-version`. This entry point is a subset of `set-version`, and is used only by test workflows. We will replace these call sites in future.

Updates relevant native files in the `react-native` package to materialize the given release version. This is run by `set-version` unless `--skipReactNativeVersion` is passed.
