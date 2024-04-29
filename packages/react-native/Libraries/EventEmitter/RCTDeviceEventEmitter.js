/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {IEventEmitter} from '../vendor/emitter/EventEmitter';

import {beginEvent, endEvent} from '../Performance/Systrace';
import EventEmitter from '../vendor/emitter/EventEmitter';

// FIXME: use typed events
type RCTDeviceEventDefinitions = $FlowFixMe;

/**
 * Global EventEmitter used by the native platform to emit events to JavaScript.
 * Events are identified by globally unique event names.
 *
 * NativeModules that emit events should instead subclass `NativeEventEmitter`.
 */
class RCTDeviceEventEmitter extends EventEmitter<RCTDeviceEventDefinitions> {
  // Add systrace to RCTDeviceEventEmitter.emit method for debugging
  emit<TEvent: $Keys<RCTDeviceEventDefinitions>>(
    eventType: TEvent,
    ...args: RCTDeviceEventDefinitions[TEvent]
  ): void {
    beginEvent(() => `RCTDeviceEventEmitter.emit#${eventType}`);
    super.emit(eventType, ...args);
    endEvent();
  }
}
const instance = new RCTDeviceEventEmitter();

Object.defineProperty(global, '__rctDeviceEventEmitter', {
  configurable: true,
  value: instance,
});

export default (instance: IEventEmitter<RCTDeviceEventDefinitions>);
