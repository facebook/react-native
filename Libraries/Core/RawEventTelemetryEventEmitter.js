/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import EventEmitter from '../vendor/emitter/EventEmitter';
import type {IEventEmitter} from '../vendor/emitter/EventEmitter';

export type RawEventTelemetryEvent = $ReadOnly<{|
  eventName: string,
  // We expect, but do not/cannot require, that nativeEvent is an object
  // with the properties: key, elementType (string), type (string), tag (numeric),
  // and a stateNode of the native element/Fiber the event was emitted to.
  nativeEvent: {[string]: mixed},
|}>;

type RawEventDefinitions = {
  [eventChannel: string]: [RawEventTelemetryEvent],
};

const RawEventTelemetryEventEmitter: IEventEmitter<RawEventDefinitions> =
  new EventEmitter<RawEventDefinitions>();

export default RawEventTelemetryEventEmitter;
