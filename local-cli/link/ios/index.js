/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = function() {
  return {
    isInstalled: require('./common/isInstalled'),
    register: require('./common/registerNativeModule'),
    unregister: require('./common/unregisterNativeModule'),
    copyAssets: require('./copyAssets'),
    unlinkAssets: require('./unlinkAssets'),
  };
};
