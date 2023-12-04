# Packages

## Creating new package

1. Create a new folder inside `packages/<your-package>`.
2. Add `package.json` file:
```json
{
  "name": "@react-native/<your-package>",
  "version": "1000.0.0",
  "description": "Package description",
  "keywords": [
    "react-native"
  ],
  "homepage": "https://github.com/facebook/react-native/tree/HEAD/packages/<your-package>#readme",
  "bugs": "https://github.com/facebook/react-native/issues",
  "repository": {
    "type": "git",
    "url": "https://github.com/facebook/react-native.git",
    "directory": "packages/<your-package>"
  },
  "license": "MIT",
}
```
2. Add `README.md` and an `index.js` file

### Setting up build step for packages containing `flow` types (Optional)

1. Make sure the package implementation is placed inside of `src` directory (this is what the `build.js` script expects).
2. Add `.gitignore` file containing: 

```
# Dependencies
/node_modules

# Build output
/dist
```

3. Add following properties to `package.json`:

```json
{
  //...
  "exports": {
    ".": "./src/index.js",
    "./package.json": "./package.json"
  },
  "files": [
    "dist"
  ],
  "engines": {
    "node": ">=18"
  }
}
```

- Next, in `scripts/build/config.js` add `<your-package>` inside of `buildConfig` object, like so:
```js
const buildConfig = {
  packages: {
    '<your-package>': {
        target: 'node'
    }
  },
};
```

- Optionally you can specify `buildOptions` for example: whether to emit TypeScript definition files (`.d.ts`).

In order to verify if new package was configured properly run `yarn build` in the root directory and check if `packages/<your-package>/dist` folder contains newly created files.




