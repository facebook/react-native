/**
 * @generated SignedSource<<d17b6e5d9b7118fb0ed9169f579e5b8a>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * @providesModule EmitterSubscription
 * @typechecks
 */
'use strict';

var EventSubscription = require('EventSubscription');

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */
class EmitterSubscription extends EventSubscription {

  /**
   * @param {EventSubscriptionVendor} subscriber - The subscriber that controls
   *   this subscription
   * @param {function} listener - Function to invoke when the specified event is
   *   emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */
  constructor(subscriber: EventSubscriptionVendor, listener, context: ?Object) {
    super(subscriber);
    this.listener = listener;
    this.context = context;
  }
}

module.exports = EmitterSubscription;
