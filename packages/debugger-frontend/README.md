# @react-native/debugger-frontend

![npm package](https://img.shields.io/npm/v/@react-native/debugger-frontend?color=brightgreen&label=npm%20package)

Debugger frontend for React Native based on Chrome DevTools.

This package is internal to React Native and is intended to be used via [`@react-native/dev-middleware`](https://www.npmjs.com/package/@react-native/dev-middleware).

## Usage

The package exports the absolute path to the directory containing the frontend assets.

```js
const frontendPath = require('@react-native/debugger-frontend');

// Pass frontendPath to a static server, etc
```

## Contributing

### Source repo

Source code for this package lives in the [facebookexperimental/rn-chrome-devtools-frontend](https://github.com/facebookexperimental/rn-chrome-devtools-frontend) repo. See below for how we build and check in changes.

### Updating the frontend assets

The compiled assets for the debugger frontend are periodically checked into this package under the `dist/` folder. To update these, run `node scripts/debugger-frontend/sync-and-build` from the root of your `react-native` checkout.

```sh
# For main
node scripts/debugger-frontend/sync-and-build --branch main

# For stable branches (e.g. '0.73-stable')
node scripts/debugger-frontend/sync-and-build --branch 0.73-stable
```

By default, this will clone and build from [facebookexperimental/rn-chrome-devtools-frontend](https://github.com/facebookexperimental/rn-chrome-devtools-frontend).
