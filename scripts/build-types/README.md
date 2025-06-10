# scripts/build-types

TypeScript build pipeline for React Native's JavaScript API.

## Overview

`yarn build-types` is a custom build pipeline for translating React Native's Flow source code to TypeScript.

Specifically, it reduces the runtime JavaScript API of `react-native` into two outputs:

- **Generated TypeScript types**\
Public user types for react-native, shipped to npm\
`packages/react-native/types_generated/`
- **‌Public API snapshot (experimental)**\
Snapshot file of the public API shape, used by maintainers\
`packages/react-native/ReactNativeApi.d.ts`

#### Dependencies

`yarn build-types` makes use of the following dependencies, composed with other pre/post transformation steps and dependency resolution.

- Flow → TypeScript conversion: [flow-api-extractor](https://www.npmjs.com/package/flow-api-translator)
- TypeScript → (initial) API rollup: [@microsoft/api-extractor](https://api-extractor.com/)

## Usage

`yarn build-types` is designed to be run by maintainers with minimal arguments.

> API snapshot generation is currently **experimental**, and will be folded into the default behaviour when ready.

```sh
# Build types
yarn build-types

# Build types + API snapshot (experimental)
yarn build-types --withSnapshot [--validate]
```

#### Configuration

Sparse configuration options are defined and documented in `scripts/build-types/config.js`.

## About the two formats

### Generated TypeScript types

`types_generated/`

Directory providing TypeScript user types for the `react-native` package, distributed via npm.

- Gitignored.
- Scoped to the `index.d.ts` entry point via `package.json#exports`.
- Preserves `unstable_` and `experimental_` APIs.
- Preserves doc comments.
- Preserves source file names (for go to definition).

### Public API snapshot (experimental)

`ReactNative.d.ts`

Provides a human-readable, maintainable reference of the React Native's public JavaScript API, optimized for developers and diff tooling.

- Committed to the repo.
- Strips `unstable_` and `experimental_` APIs.
- Strips doc comments.
- Strips source file names and some un-exported type names (WIP).
