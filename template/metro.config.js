/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
