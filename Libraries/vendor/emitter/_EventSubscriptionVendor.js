/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const invariant = require('invariant');

import type EventSubscription from './_EventSubscription';

/**
 * EventSubscriptionVendor stores a set of EventSubscriptions that are
 * subscribed to a particular event type.
 */
class EventSubscriptionVendor<EventDefinitions: {...}> {
  _subscriptionsForType: {
    [type: $Keys<EventDefinitions>]: Array<
      EventSubscription<EventDefinitions, $FlowFixMe>,
    >,
    ...
  };

  constructor() {
    this._subscriptionsForType = {};
  }

  /**
   * Adds a subscription keyed by an event type.
   *
   * @param {string} eventType
   * @param {EventSubscription} subscription
   */
  addSubscription<K: $Keys<EventDefinitions>>(
    eventType: K,
    subscription: EventSubscription<EventDefinitions, K>,
  ): EventSubscription<EventDefinitions, K> {
    invariant(
      subscription.subscriber === this,
      'The subscriber of the subscription is incorrectly set.',
    );
    if (!this._subscriptionsForType[eventType]) {
      this._subscriptionsForType[eventType] = [];
    }
    const key = this._subscriptionsForType[eventType].length;
    this._subscriptionsForType[eventType].push(subscription);
    subscription.eventType = eventType;
    subscription.key = key;
    return subscription;
  }

  /**
   * Removes a bulk set of the subscriptions.
   *
   * @param {?string} eventType - Optional name of the event type whose
   *   registered subscriptions to remove, if null remove all subscriptions.
   */
  removeAllSubscriptions<K: $Keys<EventDefinitions>>(eventType: ?K): void {
    if (eventType == null) {
      this._subscriptionsForType = {};
    } else {
      delete this._subscriptionsForType[eventType];
    }
  }

  /**
   * Removes a specific subscription. Instead of calling this function, call
   * `subscription.remove()` directly.
   *
   * @param {object} subscription
   */
  removeSubscription<K: $Keys<EventDefinitions>>(
    subscription: EventSubscription<EventDefinitions, K>,
  ): void {
    const eventType = subscription.eventType;
    const key = subscription.key;

    const subscriptionsForType = this._subscriptionsForType[eventType];
    if (subscriptionsForType) {
      delete subscriptionsForType[key];
    }
  }

  /**
   * Returns the array of subscriptions that are currently registered for the
   * given event type.
   *
   * Note: This array can be potentially sparse as subscriptions are deleted
   * from it when they are removed.
   *
   * TODO: This returns a nullable array. wat?
   *
   * @param {string} eventType
   * @returns {?array}
   */
  getSubscriptionsForType<K: $Keys<EventDefinitions>>(
    eventType: K,
  ): ?Array<EventSubscription<EventDefinitions, K>> {
    return this._subscriptionsForType[eventType];
  }
}

module.exports = EventSubscriptionVendor;
