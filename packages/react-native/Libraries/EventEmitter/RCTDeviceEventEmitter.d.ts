/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import EventEmitter, {
  EmitterSubscription,
} from '../vendor/emitter/EventEmitter';

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTDeviceEventEmitter.
 */
export default interface DeviceEventEmitterStatic extends EventEmitter {
  new (): DeviceEventEmitterStatic;
  addListener(
    type: string,
    listener: (data: any) => void,
    context?: any,
  ): EmitterSubscription;
}

export const DeviceEventEmitter: DeviceEventEmitterStatic;
