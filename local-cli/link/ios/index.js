/** @format */

module.exports = function() {
  return {
    isInstalled: require('./common/isInstalled'),
    register: require('./common/registerNativeModule'),
    unregister: require('./common/unregisterNativeModule'),
    copyAssets: require('./copyAssets'),
    unlinkAssets: require('./unlinkAssets'),
  };
};
