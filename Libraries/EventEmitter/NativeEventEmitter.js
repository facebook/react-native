/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {
  type EventSubscription,
  type IEventEmitter,
} from '../vendor/emitter/EventEmitter';
import Platform from '../Utilities/Platform';
import RCTDeviceEventEmitter from './RCTDeviceEventEmitter';
import invariant from 'invariant';

interface NativeModule {
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

export type {EventSubscription};

/**
 * `NativeEventEmitter` is intended for use by Native Modules to emit events to
 * JavaScript listeners. If a `NativeModule` is supplied to the constructor, it
 * will be notified (via `addListener` and `removeListeners`) when the listener
 * count changes to manage "native memory".
 *
 * Currently, all native events are fired via a global `RCTDeviceEventEmitter`.
 * This means event names must be globally unique, and it means that call sites
 * can theoretically listen to `RCTDeviceEventEmitter` (although discouraged).
 */
export default class NativeEventEmitter<TEventToArgsMap: {...}>
  implements IEventEmitter<TEventToArgsMap> {
  _nativeModule: ?NativeModule;

  constructor(nativeModule: ?NativeModule) {
    if (Platform.OS === 'ios') {
      invariant(
        nativeModule != null,
        '`new NativeEventEmitter()` requires a non-null argument.',
      );
    }

    const hasAddListener =
      !!nativeModule && typeof nativeModule.addListener === 'function';
    const hasRemoveListeners =
      !!nativeModule && typeof nativeModule.removeListeners === 'function';

    if (nativeModule && hasAddListener && hasRemoveListeners) {
      this._nativeModule = nativeModule;
    } else if (nativeModule != null) {
      if (!hasAddListener) {
        console.warn(
          '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
        );
      }
      if (!hasRemoveListeners) {
        console.warn(
          '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.',
        );
      }
    }
  }

  addListener<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    listener: (...args: $ElementType<TEventToArgsMap, TEvent>) => mixed,
    context?: mixed,
  ): EventSubscription {
    this._nativeModule?.addListener(eventType);
    let subscription: ?EventSubscription = RCTDeviceEventEmitter.addListener(
      eventType,
      listener,
      context,
    );

    return {
      remove: () => {
        if (subscription != null) {
          this._nativeModule?.removeListeners(1);
          // $FlowFixMe[incompatible-use]
          subscription.remove();
          subscription = null;
        }
      },
    };
  }

  /**
   * @deprecated Use `remove` on the EventSubscription from `addListener`.
   */
  removeListener<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    listener: (...args: $ElementType<TEventToArgsMap, TEvent>) => mixed,
  ): void {
    this._nativeModule?.removeListeners(1);
    // NOTE: This will report a deprecation notice via `console.error`.
    // $FlowFixMe[prop-missing] - `removeListener` exists but is deprecated.
    RCTDeviceEventEmitter.removeListener(eventType, listener);
  }

  emit<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    ...args: $ElementType<TEventToArgsMap, TEvent>
  ): void {
    // Generally, `RCTDeviceEventEmitter` is directly invoked. But this is
    // included for completeness.
    RCTDeviceEventEmitter.emit(eventType, ...args);
  }

  removeAllListeners<TEvent: $Keys<TEventToArgsMap>>(
    eventType?: ?TEvent,
  ): void {
    invariant(
      eventType != null,
      '`NativeEventEmitter.removeAllListener()` requires a non-null argument.',
    );
    this._nativeModule?.removeListeners(this.listenerCount(eventType));
    RCTDeviceEventEmitter.removeAllListeners(eventType);
  }

  listenerCount<TEvent: $Keys<TEventToArgsMap>>(eventType: TEvent): number {
    return RCTDeviceEventEmitter.listenerCount(eventType);
  }
}
