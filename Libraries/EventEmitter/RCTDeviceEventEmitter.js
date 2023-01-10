/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import EventEmitter from '../vendor/emitter/EventEmitter';
import type {IEventEmitter} from '../vendor/emitter/EventEmitter';

// FIXME: use typed events
type RCTDeviceEventDefinitions = $FlowFixMe;

/**
 * Global EventEmitter used by the native platform to emit events to JavaScript.
 * Events are identified by globally unique event names.
 *
 * NativeModules that emit events should instead subclass `NativeEventEmitter`.
 */
export default (new EventEmitter(): IEventEmitter<RCTDeviceEventDefinitions>);
