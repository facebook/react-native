# Breaking Changes

## 0.14

- D2530161: Need to introduce rn-cli.config.js for existing projects
- D2533877: `react-native bundle` API changes:
  - API is now `entry-file <path>` based instead of url based.
  - Need to specify which platform you're bundling for `--platform <ios|android>`.
  - Option `--out` has been renamed for `--bundle-output`.
  - Source maps are no longer automatically generated. Need to specify `--sourcemap-output <path>` option to indicate where to put the source maps.
  - `removeClippedSubviews` now defaults to `true` on `ListView`. This is generally the behavior people expect from `ListView` so we're making it default to `true`. If you see any issues please report them.
