# Breaking Changes

**Breaking changes are now tracked as part of [Release Notes](https://github.com/facebook/react-native/releases)**.

## 0.16

- Touch events on Android now have coordinates consistent with iOS: [0c2ee5](https://github.com/facebook/react-native/commit/0c2ee5d480e696f8621252c936a8773e8de9f8b6)
- YellowBox enabled by default: [8ab518](https://github.com/facebook/react-native/commit/8ab51828ff077ae0ad10c06f62f9f01d58b9bf85)
- React Native now uses Babel 6 (props to tadeuzagallo for upgrading!). We've been using React Native with Babel 6 at Facebook for quite a while now. Nevertheless, please report any errors related to Babel, such as transforms for some JS features not working as expected and we'll fix them.
- Decorators won't work until [T2645](https://phabricator.babeljs.io/T2645) lands in Babel.
- Exporting default class that extends a base class won't work due to Babel's [T2694](https://phabricator.babeljs.io/T2694).

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
