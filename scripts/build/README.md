# scripts/build

Shared build setup for the React Native monorepo.

## Overview

These scripts form the modern build setup for JavaScript ([Flow](https://flow.org/)) packages in `react-native`, exposed as `yarn build`.

> [!Tip]
> Generally, React Native maintainers do not need to run `yarn build`, as all packages will run from source during development. Please continue reading if you are adding/removing a package or modifying its build configuration.

#### Key info

- **Which packages are included?**
  - Currently, only Node.js-targeting packages are included, configured in `config.js`.
  - We don't yet include runtime packages (targeting Metro). These are instead transformed in user space via `@react-native/babel-preset`.
- **When does the build run?**
  - Packages are built in CI workflows — both for integration/E2E tests, and before publishing to npm.

#### Limitations/quirks

> [!Note]
> **🚧 Work in progress!** This is not the final state for our monorepo build tooling. Unfortunately, our solution options are narrow due to integration requirements with Meta's codebase.

- Running `yarn build` will mutate `package.json` files in place, resulting in a dirty Git working copy.
- We make use of "wrapper files" (`.js` → `.js.flow`) for each package entry point, to enable running from source with zero config. To validate these, package entry points must be explicitly defined via `"exports"`.

## Usage

**💡 Reminder**: 99% of the time, there is no need to use `yarn build`, as all packages will run from source during development.

Build commands are exposed as npm scripts at the repo root.

```sh
# Build all packages
yarn build

# Build a specific package
yarn build dev-middleware

# Clean build directories
yarn clean
```

Once built, developing in the monorepo should continue to work — now using the compiled version of each package.

> [!Warning]
> **Build changes should not be committed**. Currently, `yarn build` will make changes to each `package.json` file, which should not be committed. This is validated in CI.

## Configuration

Monorepo packages must be opted in for build, configured in `config.js` (where build options are also documented).

```js
const buildConfig /*: BuildConfig */ = {
  'packages': {
    'dev-middleware': {
      emitTypeScriptDefs: true,
      target: 'node',
    },
    ...
```

#### Required package structure

Opting a package into the `yarn build` setup requires a strict file layout. This is done to simplify config and to force consistency across the monorepo.

```sh
packages/
  example-pkg/
    src/             # All source files
      index.js       # Entry point wrapper file (calls babel-register.js) (compiled away)
      index.flow.js  # Entry point implementation in Flow
      [other files]
    package.json     # Includes "exports" field, ideally only src/index.js
```

Notes:

- To minimize complexity, prefer only a single entry of `{".": "src/index.js"}` in `"exports"` for new packages.

## Build behavior

Running `yarn build` will compile each package following the below steps, depending on the configured `target` and other build options.

- Create a `dist/` directory, replicating each source file under `src/`:
  - For every `@flow` file, strip Flow annotations using [flow-api-extractor](https://www.npmjs.com/package/flow-api-translator).
  - For every entry point in `"exports"`, remove the `.js` wrapper file and compile from the `.flow.js` source.
- Rewrite each package `"exports"` target to map to the `dist/` directory location.
- If configured, emit a Flow (`.js.flow`) or TypeScript (`.d.ts`) type definition file per source file, using [flow-api-extractor](https://www.npmjs.com/package/flow-api-translator).

Together, this might look like the following:

```sh
packages/
  example-pkg/
    dist/
      index.js       # Compiled source file (from index.flow.js)
      index.js.flow  # Flow definition file
      index.d.ts     # TypeScript definition file
      [other transformed files]
    package.json     # "src/index.js" export rewritten to "dist/index.js"
```

**Link**: [Example `dist/` output on npm](https://www.npmjs.com/package/@react-native/dev-middleware/v/0.76.5?activeTab=code).
