# scripts/releases

Scripts related to creating a React Native release. These are the lower level entry points used by [**scripts/releases-ci**](https://github.com/facebook/react-native/tree/main/scripts/releases-ci).

## Commands

For information on command arguments, run `node <command> --help`.

### `remove-new-arch-flags.js`

Updates native build files to disable the New Architecture.

### `set-rn-version.js`

Updates relevant files in the `react-native` package and template to materialize the given release version.

### `update-template-package.js`

Updates local dependencies in the template `package.json`.
