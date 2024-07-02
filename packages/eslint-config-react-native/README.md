# @react-native/eslint-config

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
const reactNativeConfig = require('@react-native/eslint-config');  
const myplugin = require('my-plugin');

module.exports = [
  ...reactNativeConfig,
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
    "extends": "@react-native"
}
```

## Plugin supported Eslint versions

| Eslint version       | `.eslintrc` support | `eslint.config.js` support |
| :------------------- | :-----------------: | :------------------------: |
| `>= 9.0.0`           | ❌                  | ❌                         |
| `>= 8.23.0 < 9.0.0`  | ✅                  | ✅                         |
| `< 8.23.0`           | ✅                  | ❌                         |



[version-badge]: https://img.shields.io/npm/v/@react-native/eslint-config.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native/eslint-config
