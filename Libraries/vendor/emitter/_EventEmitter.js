/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 * @typecheck
 */

'use strict';

const invariant = require('invariant');

import EmitterSubscription from './_EmitterSubscription';
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
class EventEmitter {
  _subscriber: EventSubscriptionVendor;

  /**
   * @constructor
   *
   * @param {EventSubscriptionVendor} subscriber - Optional subscriber instance
   *   to use. If omitted, a new subscriber will be created for the emitter.
   */
  constructor(subscriber: ?EventSubscriptionVendor) {
    this._subscriber = subscriber || new EventSubscriptionVendor();
  }

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * TODO: Annotate the listener arg's type. This is tricky because listeners
   *       can be invoked with varargs.
   *
   * @param {string} eventType - Name of the event to listen to
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */
  addListener(
    eventType: string,
    listener: Function,
    context: ?Object,
  ): EmitterSubscription {
    return (this._subscriber.addSubscription(
      eventType,
      new EmitterSubscription(this, this._subscriber, listener, context),
    ): any);
  }

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param {?string} eventType - Optional name of the event whose registered
   *   listeners to remove
   */
  removeAllListeners(eventType: ?string) {
    this._subscriber.removeAllSubscriptions(eventType);
  }

  /**
   * Removes a specific subscription. Called by the `remove()` method of the
   * subscription itself to ensure any necessary cleanup is performed.
   */
  removeSubscription(subscription: EmitterSubscription) {
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
  listenerCount(eventType: string): number {
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
  emit(eventType: string) {
    const subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    if (subscriptions) {
      for (let i = 0, l = subscriptions.length; i < l; i++) {
        const subscription = subscriptions[i];

        // The subscription may have been removed during this event loop.
        if (subscription && subscription.listener) {
          subscription.listener.apply(
            subscription.context,
            Array.prototype.slice.call(arguments, 1),
          );
        }
      }
    }
  }

  /**
   * Removes the given listener for event of specific type.
   *
   * @param {string} eventType - Name of the event to emit
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   *
   * @example
   *   emitter.removeListener('someEvent', function(message) {
   *     console.log(message);
   *   }); // removes the listener if already registered
   *
   */
  removeListener(eventType: String, listener) {
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
