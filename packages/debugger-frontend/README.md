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

## Updating the frontend assets

The compiled frontend assets are checked into the React Native repo. Run `node scripts/debugger-frontend/sync-and-build` from the root of your `react-native` checkout to update them.
