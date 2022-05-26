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

import type {EventSubscription} from './EventSubscription';
import type EventSubscriptionVendor from './_EventSubscriptionVendor';

/**
 * EventSubscription represents a subscription to a particular event. It can
 * remove its own subscription.
 */
class _EventSubscription<EventDefinitions: {...}, K: $Keys<EventDefinitions>>
  implements EventSubscription
{
  eventType: K;
  key: number;
  subscriber: EventSubscriptionVendor<EventDefinitions>;
  listener: ?(...$ElementType<EventDefinitions, K>) => mixed;
  context: ?$FlowFixMe;

  /**
   * @param {EventSubscriptionVendor} subscriber the subscriber that controls
   *   this subscription.
   */
  constructor(subscriber: EventSubscriptionVendor<EventDefinitions>) {
    this.subscriber = subscriber;
  }

  /**
   * Removes this subscription from the subscriber that controls it.
   */
  remove(): void {
    this.subscriber.removeSubscription(this);
  }
}

module.exports = _EventSubscription;
