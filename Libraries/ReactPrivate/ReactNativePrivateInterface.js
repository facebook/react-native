/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// flowlint unsafe-getters-setters:off
module.exports = {
  get BatchedBridge() {
    return require('../BatchedBridge/BatchedBridge.js');
  },
  get ExceptionsManager() {
    return require('../Core/ExceptionsManager');
  },
  get Platform() {
    return require('../Utilities/Platform');
  },
  get RCTEventEmitter() {
    return require('../EventEmitter/RCTEventEmitter');
  },
  get ReactNativeViewConfigRegistry() {
    return require('../Renderer/shims/ReactNativeViewConfigRegistry');
  },
  get TextInputState() {
    return require('../Components/TextInput/TextInputState');
  },
  get UIManager() {
    return require('../ReactNative/UIManager');
  },
  get deepDiffer() {
    return require('../Utilities/differ/deepDiffer');
  },
  get deepFreezeAndThrowOnMutationInDev() {
    return require('../Utilities/deepFreezeAndThrowOnMutationInDev');
  },
  get flattenStyle() {
    return require('../StyleSheet/flattenStyle');
  },
  get ReactFiberErrorDialog() {
    return require('../Core/ReactFiberErrorDialog');
  },
};
