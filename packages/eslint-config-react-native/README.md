# @react-native/eslint-config

[![Version][version-badge]][package]

## Installation

```
yarn add --dev eslint prettier @react-native/eslint-config
```

*Note: We're using `yarn` to install deps. Feel free to change commands to use `npm` 3+ and `npx` if you like*

## Usage

### For ESLint 9+ (Flat Config)

Add to your `eslint.config.js`:

```javascript
const reactNativeConfig = require('@react-native/eslint-config/flat');

module.exports = [
  ...reactNativeConfig,
  // Your custom config here
];
```

Or with ES modules:

```javascript
import reactNativeConfig from '@react-native/eslint-config/flat';

export default [
  ...reactNativeConfig,
  // Your custom config here
];
```

### For ESLint 8 (Legacy Config)

Add to your eslint config (`.eslintrc`, or `eslintConfig` field in `package.json`):

```json
{
    "extends": "@react-native"
}
```

[version-badge]: https://img.shields.io/npm/v/@react-native/eslint-config.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native/eslint-config
