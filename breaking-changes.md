# Breaking Changes

## 0.15

- React Native now uses [React 0.14](http://facebook.github.io/react/blog/2015/10/07/react-v0.14.html); see the linked blog post for a changelog (at this time, the package split has not been made in RN (i.e., please continue to use `require('react-native')`) and refs to native components have not changed)

## 0.14

- D2533877: `react-native bundle` API changes:
  - API is now `entry-file <path>` based instead of url based.
  - Need to specify which platform you're bundling for `--platform <ios|android>`.
  - Option `--out` has been renamed for `--bundle-output`.
  - Source maps are no longer automatically generated. Need to specify `--sourcemap-output <path>` option to indicate where to put the source maps.
- D2538070:
  - The `--minify` option is now infered based on the `--dev` value. To get a production minified bundle use `--dev false` as `--dev` defaults to true.
- [28f6eb](https://github.com/facebook/react-native/commit/28f6eba22d5bd3dfead3a115f93e37f25b1910ca): `removeClippedSubviews` now defaults to `true` on `ListView`. This is generally the behavior people expect from `ListView` so we're making it default to `true`. If you see any issues please report them.
- [82fad3](https://github.com/facebook/react-native/commit/82fad33af7dac32cd556eea35674aca4dc707f71): Remove redundant script to start packager, it can still be started using `react-native start` or `npm start`
