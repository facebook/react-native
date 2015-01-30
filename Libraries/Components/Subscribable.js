/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Subscribable
 */
'use strict';

var Subscribable = {
  Mixin: {
    componentWillMount: function() {
      this._subscriptions = [];
    },
    componentWillUnmount: function() {
      this._subscriptions.forEach((subscription) => subscription.remove());
      this._subscriptions = null;
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
    addListenerOn: function(eventEmitter, eventType, listener, context) {
      this._subscriptions.push(
        eventEmitter.addListener(eventType, listener, context)
      );
    }
  }
};

module.exports = Subscribable;
