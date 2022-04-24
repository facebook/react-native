/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 * @typecheck
 */

const invariant = require('invariant');

import EmitterSubscription from './_EmitterSubscription';
import {type EventSubscription} from './EventSubscription';
import EventSubscriptionVendor from './_EventSubscriptionVendor';

const sparseFilterPredicate = () => true;

/**
 * @class EventEmitter
 * @description
 * An EventEmitter is responsible for managing a set of listeners and publishing
 * events to them when it is told that such events happened. In addition to the
 * data for the given event it also sends a event control object which allows
 * the listeners/handlers to prevent the default behavior of the given event.
 *
 * The emitter is designed to be generic enough to support all the different
 * contexts in which one might want to emit events. It is a simple multicast
 * mechanism on top of which extra functionality can be composed. For example, a
 * more advanced emitter may use an EventHolder and EventFactory.
 */
class EventEmitter<EventDefinitions: {...}> {
  _subscriber: EventSubscriptionVendor<EventDefinitions> =
    new EventSubscriptionVendor<EventDefinitions>();

  /**
   * @constructor
   */
  constructor(subscriber: ?EventSubscriptionVendor<EventDefinitions>) {
    if (subscriber != null) {
      console.warn('EventEmitter(...): Constructor argument is deprecated.');
      this._subscriber = subscriber;
    }
  }

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * @param {string} eventType - Name of the event to listen to
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */
  addListener<K: $Keys<EventDefinitions>>(
    eventType: K,
    // FIXME: listeners should return void instead of mixed to prevent issues
    listener: (...$ElementType<EventDefinitions, K>) => mixed,
    context: $FlowFixMe,
  ): EventSubscription {
    return (this._subscriber.addSubscription(
      eventType,
      new EmitterSubscription(this, this._subscriber, listener, context),
    ): $FlowFixMe);
  }

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param {?string} eventType - Optional name of the event whose registered
   *   listeners to remove
   */
  removeAllListeners<K: $Keys<EventDefinitions>>(eventType: ?K): void {
    this._subscriber.removeAllSubscriptions(eventType);
  }

  /**
   * @deprecated Use `remove` on the EventSubscription from `addListener`.
   */
  removeSubscription<K: $Keys<EventDefinitions>>(
    subscription: EmitterSubscription<EventDefinitions, K>,
  ): void {
    console.warn(
      'EventEmitter.removeSubscription(...): Method has been deprecated. ' +
        'Please instead use `remove()` on the subscription itself.',
    );
    this.__removeSubscription(subscription);
  }

  /**
   * Called by `EmitterSubscription` to bypass the above deprecation warning.
   */
  __removeSubscription<K: $Keys<EventDefinitions>>(
    subscription: EmitterSubscription<EventDefinitions, K>,
  ): void {
    invariant(
      subscription.emitter === this,
      'Subscription does not belong to this emitter.',
    );
    this._subscriber.removeSubscription(subscription);
  }

  /**
   * Returns the number of listeners that are currently registered for the given
   * event.
   *
   * @param {string} eventType - Name of the event to query
   * @returns {number}
   */
  listenerCount<K: $Keys<EventDefinitions>>(eventType: K): number {
    const subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    return subscriptions
      ? // We filter out missing entries because the array is sparse.
        // "callbackfn is called only for elements of the array which actually
        // exist; it is not called for missing elements of the array."
        // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-array.prototype.filter
        subscriptions.filter(sparseFilterPredicate).length
      : 0;
  }

  /**
   * Emits an event of the given type with the given data. All handlers of that
   * particular type will be notified.
   *
   * @param {string} eventType - Name of the event to emit
   * @param {...*} Arbitrary arguments to be passed to each registered listener
   *
   * @example
   *   emitter.addListener('someEvent', function(message) {
   *     console.log(message);
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   */
  emit<K: $Keys<EventDefinitions>>(
    eventType: K,
    ...args: $ElementType<EventDefinitions, K>
  ): void {
    const subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    if (subscriptions) {
      for (let i = 0, l = subscriptions.length; i < l; i++) {
        const subscription = subscriptions[i];

        // The subscription may have been removed during this event loop.
        if (subscription && subscription.listener) {
          subscription.listener.apply(subscription.context, args);
        }
      }
    }
  }

  /**
   * @deprecated Use `remove` on the EventSubscription from `addListener`.
   */
  removeListener<K: $Keys<EventDefinitions>>(
    eventType: K,
    // FIXME: listeners should return void instead of mixed to prevent issues
    listener: (...$ElementType<EventDefinitions, K>) => mixed,
  ): void {
    console.warn(
      `EventEmitter.removeListener('${eventType}', ...): Method has been ` +
        'deprecated. Please instead use `remove()` on the subscription ' +
        'returned by `EventEmitter.addListener`.',
    );
    const subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    if (subscriptions) {
      for (let i = 0, l = subscriptions.length; i < l; i++) {
        const subscription = subscriptions[i];

        // The subscription may have been removed during this event loop.
        // its listener matches the listener in method parameters
        if (subscription && subscription.listener === listener) {
          subscription.remove();
        }
      }
    }
  }
}

module.exports = EventEmitter;
