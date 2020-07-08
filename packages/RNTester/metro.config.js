/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');
const reactNativePath = path.resolve(__dirname, 'node_modules', 'react-native');

module.exports = {
  watchFolders: [path.resolve(__dirname, 'node_modules'), reactNativePath],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    extraNodeModules: {
      'react-native': reactNativePath,
    },
  },
};
