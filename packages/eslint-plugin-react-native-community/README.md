# eslint-plugin-react-native-community

This plugin is intended to be used in `@react-native-community/eslint-plugin`. You probably want to install that package instead.

## Installation

```
yarn add --dev eslint @react-native-community/eslint-plugin
```

*Note: We're using `yarn` to install deps. Feel free to change commands to use `npm` 3+ and `npx` if you like*

## Usage

Add to your eslint config (`.eslintrc`, or `eslintConfig` field in `package.json`):

```json
{
    "plugins": ["@react-native-community"]
}
```

## Rules

### `error-subclass-name`

**NOTE:** This rule is primarily used for developing React Native itself and is not generally applicable to other projects.

Enforces that error classes ( = classes with PascalCase names ending with `Error`) only extend other error classes, and that regular functions don't have names that could be mistaken for those of error classes.

### `no-haste-imports`

Disallows Haste module names in `import` statements and `require()` calls.

### `platform-colors`

Enforces that calls to `PlatformColor` and `DynamicColorIOS` are statically analyzable to enable performance optimizations.
