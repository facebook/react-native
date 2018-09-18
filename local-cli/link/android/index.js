/** @format */

module.exports = function() {
  return {
    isInstalled: require('./isInstalled'),
    register: require('./registerNativeModule'),
    unregister: require('./unregisterNativeModule'),
    copyAssets: require('./copyAssets'),
    unlinkAssets: require('./unlinkAssets'),
  };
};
