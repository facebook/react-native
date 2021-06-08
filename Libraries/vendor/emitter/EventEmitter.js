/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const EventEmitter = require('./_EventEmitter');

import type {EventSubscription} from './EventSubscription';

export default EventEmitter;

export type {EventSubscription};

/**
 * Essential interface for an EventEmitter.
 */
export interface IEventEmitter<TEventToArgsMap: {...}> {
  /**
   * Registers a listener that is called when the supplied event is emitted.
   * Returns a subscription that has a `remove` method to undo registration.
   */
  addListener<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    listener: (...args: $ElementType<TEventToArgsMap, TEvent>) => mixed,
    context?: mixed,
  ): EventSubscription;

  /**
   * Emits the supplied event. Additional arguments supplied to `emit` will be
   * passed through to each of the registered listeners.
   */
  emit<TEvent: $Keys<TEventToArgsMap>>(
    eventType: TEvent,
    ...args: $ElementType<TEventToArgsMap, TEvent>
  ): void;

  /**
   * Removes all registered listeners.
   */
  removeAllListeners<TEvent: $Keys<TEventToArgsMap>>(eventType?: ?TEvent): void;

  /**
   * Returns the number of registered listeners for the supplied event.
   */
  listenerCount<TEvent: $Keys<TEventToArgsMap>>(eventType: TEvent): number;
}
