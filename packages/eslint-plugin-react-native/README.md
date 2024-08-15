# @react-native/eslint-plugin

[![Version][version-badge]][package]

## About
This plugin exports a recommended eslint config for React Native projects 

## Installation

```
yarn add --dev eslint prettier @react-native/eslint-config
```

*Note: We're using `yarn` to install deps. Feel free to change commands to use `npm` 3+ and `npx` if you like*

## Usage

From [`v8.23.0`](https://github.com/eslint/eslint/releases/tag/v8.23.0) onwards, you can use `eslint.config.js` which uses the new [flat config file format](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new).

```javascript
const reactNative = require('@react-native/eslint-plugin');  
const myplugin = require('my-plugin');

module.exports = [
  ...reactNative.configs.flat,
  {
    plugins: {
       myplugin    
    },
    ...
  },
];
```

If you're still using a version of eslint < `v8.23.0` or still using the old configuration files, place the following on your eslint config file (`.eslintrc`, or `eslintConfig` field in `package.json`):

```json
{
    "extends": "plugin:@react-native/legacy"
}
```

## Plugin supported Eslint versions

| Eslint version       | `.eslintrc` support | `eslint.config.js` support |
| :------------------- | :-----------------: | :------------------------: |
| `>= 9.0.0`           | ❌                  | ✅                         |
| `>= 8.23.0 < 9.0.0`  | ✅                  | ✅                         |
| `< 8.23.0`           | ✅                  | ❌                         |


## Manual Configuration

This plugin also exports rules that you can manually configure by importing this package as a plugin

## Usage

```javascript
const reactNative = require('@react-native/eslint-plugin');  

module.exports = [
  {
    plugins: {
       reactNative    
    },
    ...
  },
];
```

If you're still using a version of eslint < `v8.23.0` or still using the old configuration files (`.eslintrc`, or `eslintConfig` field in `package.json`):

```json
{
    "plugins": ["@react-native"]
}
```

## Rules

### `platform-colors`

Enforces that calls to `PlatformColor` and `DynamicColorIOS` are statically analyzable to enable performance optimizations.

## Testing

To run the tests in this package, run the following commands from the React Native root folder:

1. `yarn` to install the dependencies. You just need to run this once
2. `yarn jest packages/eslint-plugin-react-native`.


[version-badge]: https://img.shields.io/npm/v/@react-native/eslint-plugin.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native/eslint-plugin

