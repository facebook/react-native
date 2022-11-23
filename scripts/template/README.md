## Why?

The main purpose of `install-dependencies.js` is to bootstrap [Verdaccio](https://verdaccio.org/docs/what-is-verdaccio). It will host all the local packages, which are not yet present on npm registry. In the near future this should help us in keep template tests green, because once we move to [monorepo structure](https://github.com/react-native-community/discussions-and-proposals/pull/480), template app may use some versions of dependencies that are not yet present on npm registry.

## I have migrated some module to package, which is not yet published to npm, how to use it?

First of all, you need to modify [Verdaccio config](https://github.com/facebook/react-native/tree/main/scripts/template/verdaccio.yml):
```diff
 packages:
+ '<my-migrated-package-name>':
+   access: $all
+   publish: $all
  '@*/*':
    access: $all
    publish: $authenticated
    proxy: npmjs
  '**':
    access: $all
    publish: $all
    proxy: npmjs
```

After that, you should modify [install-dependencies script](https://github.com/facebook/react-native/tree/main/scripts/template/install-dependencies.js) to include your package for publishing

```diff
const PACKAGES_TO_PUBLISH_PATHS = [
  ...
+ "packages/<your-package-folder-name>"
];
```
