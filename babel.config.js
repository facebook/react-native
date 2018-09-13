/**
 * This file is for `local-cli` usage whilst testing locally and in CI and is
 * ignored by the Jest preprocessor in `jest/preprocessor.js`.
 *
 * Without this config file Metro will bundle React Native JS bundles for the
 * test apps without the `metro-react-native-babel-preset` preset.
 */
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      require('@babel/plugin-transform-runtime'),
      {
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
