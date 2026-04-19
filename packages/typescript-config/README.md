# @react-native/typescript-config

This package provides the default `tsconfig.json` used by newly built React Native apps.

This template is customized for specific versions of React Native, and should be updated in sync with the rest of your app.

## Strict TypeScript API

To opt into the new [strict TypeScript API](https://reactnative.dev/blog/2025/06/12/moving-towards-a-stable-javascript-api#strict-typescript-api-opt-in) you can extend from `@react-native/typescript-config/strict`

```jsonc
{
  "extends": "@react-native/typescript-config/strict",
  // ...
}
```

or alternatively add the `customConditions` yourself:

```jsonc
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    // ...
    "customConditions": ["react-native-strict-api", "react-native"]
  }
}
```
