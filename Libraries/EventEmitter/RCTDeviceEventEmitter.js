/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import EventEmitter from '../vendor/emitter/EventEmitter';
import type EmitterSubscription from '../vendor/emitter/_EmitterSubscription';
import EventSubscriptionVendor from '../vendor/emitter/_EventSubscriptionVendor';

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTDeviceEventEmitter.
 */
class RCTDeviceEventEmitter<
  EventDefinitions: {...},
> extends EventEmitter<EventDefinitions> {
  sharedSubscriber: EventSubscriptionVendor<EventDefinitions>;

  constructor() {
    const sharedSubscriber = new EventSubscriptionVendor<EventDefinitions>();
    super(sharedSubscriber);
    this.sharedSubscriber = sharedSubscriber;
  }

  removeSubscription<K: $Keys<EventDefinitions>>(
    subscription: EmitterSubscription<EventDefinitions, K>,
  ): void {
    if (subscription.emitter !== this) {
      subscription.emitter.removeSubscription(subscription);
    } else {
      super.removeSubscription(subscription);
    }
  }
}

// FIXME: use typed events
type RCTDeviceEventDefinitions = $FlowFixMe;

export default (new RCTDeviceEventEmitter(): RCTDeviceEventEmitter<RCTDeviceEventDefinitions>);
