/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */

const path = require('path');
const blacklist = require('metro-config/src/defaults/blacklist');

const rnmPath = path.resolve(__dirname, 'node_modules/react-native-macos');

module.exports = {
  resolver: {
    extraNodeModules: {
      'react-native': rnmPath,
    },
    platforms: ['macos', 'ios', 'android'],
    blacklistRE: blacklist([/node_modules\/react-native\/.*/]),
  },
};
