# React Native Documentation

This is the internal technical documentation for React Native. It is not intended for end users of the platform.

For information on our documentation strategy and structure, see [DOCS.md](./DOCS.md).

## Usage

This repository is not meant to be consumed directly by end users. Instead, it creates several packages that are published to the NPM registry for direct consumption by end users and frameworks.

This repository uses a monorepo approach, and public packages can be found in the [`packages`](../packages/) directory (the ones that do not contain `"private": true` in their `package.json` file).

The most important package is the [`react-native`](https://www.npmjs.com/package/react-native) package, located in [`packages/react-native`](../packages/react-native), which contains the public JavaScript API.

This repository provides the Android and iOS versions of React Native. Versions for other platforms are maintained in their own  repositories.

## Design

TODO: Explain the different components of React Native at a high level.

## Relationship with other systems

### Part of this

- [Feature Flags](../packages/react-native/src/private/featureflags/__docs__/README.md)
- Web APIs
    - [MutationObserver API](../packages/react-native/src/private/webapis/mutationobserver/__docs__/README.md)

### Used by this

This repository has many different types of dependencies: build systems, external packages to be used during development, external packages used at runtime, etc.

### Uses this

The main use cases for this repository are:
1. Developing React Native itself.
2. Testing and releasing React Native.
3. Synchronizing forks like `react-native-windows` and `react-native-macos`.
