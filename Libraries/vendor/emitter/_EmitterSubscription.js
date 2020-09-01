/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type EventEmitter from './EventEmitter';
import EventSubscription from './_EventSubscription';
import type EventSubscriptionVendor from './_EventSubscriptionVendor';

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */
class EmitterSubscription extends EventSubscription {
  // $FlowFixMe[value-as-type]
  emitter: EventEmitter;
  listener: Function;
  context: ?Object;

  /**
   * @param {EventEmitter} emitter - The event emitter that registered this
   *   subscription
   * @param {EventSubscriptionVendor} subscriber - The subscriber that controls
   *   this subscription
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */
  constructor(
    // $FlowFixMe[value-as-type]
    emitter: EventEmitter,
    subscriber: EventSubscriptionVendor,
    listener: Function,
    context: ?Object,
  ) {
    super(subscriber);
    this.emitter = emitter;
    this.listener = listener;
    this.context = context;
  }

  /**
   * Removes this subscription from the emitter that registered it.
   * Note: we're overriding the `remove()` method of EventSubscription here
   * but deliberately not calling `super.remove()` as the responsibility
   * for removing the subscription lies with the EventEmitter.
   */
  remove() {
    this.emitter.removeSubscription(this);
  }
}

module.exports = EmitterSubscription;
