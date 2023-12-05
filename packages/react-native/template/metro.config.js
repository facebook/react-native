const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {getPlatformResolver} = require('@callstack/out-of-tree-platforms');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */


const config = {
  resolver: {
    resolveRequest: getPlatformResolver({
      platformNameMap: {visionos: '@callstack/react-native-visionos'},
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
