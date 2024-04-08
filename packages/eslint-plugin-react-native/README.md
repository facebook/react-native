# @react-native/eslint-plugin

This plugin is intended to be used in [`@react-native/eslint-config`](https://github.com/facebook/react-native/tree/HEAD/packages/eslint-config-react-native). You probably want to install that package instead.

## Installation

```
yarn add --dev eslint @react-native/eslint-plugin
```

*Note: We're using `yarn` to install deps. Feel free to change commands to use `npm` 3+ and `npx` if you like*

## Usage

From [`v8.23.0`](https://github.com/eslint/eslint/releases/tag/v8.23.0) onwards, you can use `eslint.config.js` which uses the new [flat config file format](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new).

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

If you're still using a version of eslint < `v8.23.0` or still using the old configuration files, place the following on your eslint config file (`.eslintrc`, or `eslintConfig` field in `package.json`):

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
