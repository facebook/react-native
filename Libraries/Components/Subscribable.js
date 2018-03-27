/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Subscribable
 * @flow
 */
'use strict';

import type EventEmitter from 'EventEmitter';

/**
 * Subscribable provides a mixin for safely subscribing a component to an
 * eventEmitter
 *
 * This will be replaced with the observe interface that will be coming soon to
 * React Core
 */

const Subscribable = {};

Subscribable.Mixin = {

  UNSAFE_componentWillMount: function() {
    this._subscribableSubscriptions = [];
  },

  componentWillUnmount: function() {
    // This null check is a fix for a broken version of uglify-es. Should be deleted eventually
    // https://github.com/facebook/react-native/issues/17348
    this._subscribableSubscriptions && this._subscribableSubscriptions.forEach(
      (subscription) => subscription.remove()
    );
    this._subscribableSubscriptions = null;
  },

  /**
   * Special form of calling `addListener` that *guarantees* that a
   * subscription *must* be tied to a component instance, and therefore will
   * be cleaned up when the component is unmounted. It is impossible to create
   * the subscription and pass it in - this method must be the one to create
   * the subscription and therefore can guarantee it is retained in a way that
   * will be cleaned up.
   *
   * @param {EventEmitter} eventEmitter emitter to subscribe to.
   * @param {string} eventType Type of event to listen to.
   * @param {function} listener Function to invoke when event occurs.
   * @param {object} context Object to use as listener context.
   */
  addListenerOn: function(
    eventEmitter: EventEmitter,
    eventType: string,
    listener: Function,
    context: Object
  ) {
    this._subscribableSubscriptions.push(
      eventEmitter.addListener(eventType, listener, context)
    );
  }
};

module.exports = Subscribable;
