# @react-native/eslint-plugin

This plugin is intended to be used in [`@react-native/eslint-config`](https://github.com/facebook/react-native/tree/HEAD/packages/eslint-config-react-native-community). You probably want to install that package instead.

## Installation

```
yarn add --dev eslint @react-native/eslint-plugin
```

*Note: We're using `yarn` to install deps. Feel free to change commands to use `npm` 3+ and `npx` if you like*

## Usage

Add to your eslint config (`.eslintrc`, or `eslintConfig` field in `package.json`):

```json
{
    "plugins": ["@react-native"]
}
```

## Rules

### `platform-colors`

Enforces that calls to `PlatformColor` and `DynamicColorIOS` are statically analyzable to enable performance optimizations.
