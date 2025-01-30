/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import RCTDeviceEventEmitter from './RCTDeviceEventEmitter';

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTNativeAppEventEmitter.
 */
const RCTNativeAppEventEmitter = RCTDeviceEventEmitter;
export default RCTNativeAppEventEmitter;
