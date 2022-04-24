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

import type EventEmitter from './EventEmitter';
import _EventSubscription from './_EventSubscription';
import type EventSubscriptionVendor from './_EventSubscriptionVendor';
import {type EventSubscription} from './EventSubscription';

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */
class EmitterSubscription<EventDefinitions: {...}, K: $Keys<EventDefinitions>>
  extends _EventSubscription<EventDefinitions, K>
  implements EventSubscription
{
  emitter: EventEmitter<EventDefinitions>;
  listener: ?(...$ElementType<EventDefinitions, K>) => mixed;
  context: ?$FlowFixMe;

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
    emitter: EventEmitter<EventDefinitions>,
    subscriber: EventSubscriptionVendor<EventDefinitions>,
    listener: (...$ElementType<EventDefinitions, K>) => mixed,
    context: ?$FlowFixMe,
  ) {
    super(subscriber);
    this.emitter = emitter;
    this.listener = listener;
    this.context = context;
  }

  /**
   * Removes this subscription from the emitter that registered it.
   * Note: we're overriding the `remove()` method of _EventSubscription here
   * but deliberately not calling `super.remove()` as the responsibility
   * for removing the subscription lies with the EventEmitter.
   */
  remove(): void {
    this.emitter.__removeSubscription(this);
  }
}

module.exports = EmitterSubscription;
