/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  EventSubscription,
  IEventEmitter,
} from '../../vendor/emitter/EventEmitter';

import RCTDeviceEventEmitter from '../RCTDeviceEventEmitter';

/**
 * Mock `NativeEventEmitter` to ignore Native Modules.
 */
export default class NativeEventEmitter<TEventToArgsMap: {...}>
  implements IEventEmitter<TEventToArgsMap>
{
  addListener<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    listener: (...args: $ElementType<TEventToArgsMap, TEvent>) => mixed,
    context?: mixed,
  ): EventSubscription {
    return RCTDeviceEventEmitter.addListener(eventType, listener, context);
  }

  emit<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    ...args: $ElementType<TEventToArgsMap, TEvent>
  ): void {
    RCTDeviceEventEmitter.emit(eventType, ...args);
  }

  removeAllListeners<TEvent: $Keys<TEventToArgsMap>>(
    eventType?: ?TEvent,
  ): void {
    RCTDeviceEventEmitter.removeAllListeners(eventType);
  }

  listenerCount<TEvent: $Keys<TEventToArgsMap>>(eventType: TEvent): number {
    return RCTDeviceEventEmitter.listenerCount(eventType);
  }
}
