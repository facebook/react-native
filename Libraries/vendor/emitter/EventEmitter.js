/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule EventEmitter
 * @noflow
 * @typechecks
 */

var EmitterSubscription = require('EmitterSubscription');
var ErrorUtils = require('ErrorUtils');
var EventSubscriptionVendor = require('EventSubscriptionVendor');
var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');

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
  /**
   * @constructor
   */
  constructor() {
    this._subscriber = new EventSubscriptionVendor();
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
    eventType: String, listener, context: ?Object): EmitterSubscription {
    return this._subscriber.addSubscription(
      eventType,
      new EmitterSubscription(this._subscriber, listener, context));
  }

  /**
   * Similar to addListener, except that the listener is removed after it is
   * invoked once.
   *
   * @param {string} eventType - Name of the event to listen to
   * @param {function} listener - Function to invoke only once when the
   *   specified event is emitted
   * @param {*} context - Optional context object to use when invoking the
   *   listener
   */
  once(eventType: String, listener, context: ?Object): EmitterSubscription {
    var emitter = this;
    return this.addListener(eventType, function() {
      emitter.removeCurrentListener();
      listener.apply(context, arguments);
    });
  }

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param {?string} eventType - Optional name of the event whose registered
   *   listeners to remove
   */
  removeAllListeners(eventType: ?String) {
    this._subscriber.removeAllSubscriptions(eventType);
  }

  /**
   * Provides an API that can be called during an eventing cycle to remove the
   * last listener that was invoked. This allows a developer to provide an event
   * object that can remove the listener (or listener map) during the
   * invocation.
   *
   * If it is called when not inside of an emitting cycle it will throw.
   *
   * @throws {Error} When called not during an eventing cycle
   *
   * @example
   *   var subscription = emitter.addListenerMap({
   *     someEvent: function(data, event) {
   *       console.log(data);
   *       emitter.removeCurrentListener();
   *     }
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   *   emitter.emit('someEvent', 'def'); // does not log anything
   */
  removeCurrentListener() {
    invariant(
      !!this._currentSubscription,
      'Not in an emitting cycle; there is no current subscription'
    );
    this._subscriber.removeSubscription(this._currentSubscription);
  }

  /**
   * Returns an array of listeners that are currently registered for the given
   * event.
   *
   * @param {string} eventType - Name of the event to query
   * @returns {array}
   */
  listeners(eventType: String): Array /* TODO: Array<EventSubscription> */ {
    var subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    return subscriptions
      ? subscriptions.filter(emptyFunction.thatReturnsTrue).map(
          function(subscription) {
            return subscription.listener;
          })
      : [];
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
  emit(eventType: String) {
    var subscriptions = this._subscriber.getSubscriptionsForType(eventType);
    if (subscriptions) {
      var keys = Object.keys(subscriptions);
      for (var ii = 0; ii < keys.length; ii++) {
        var key = keys[ii];
        var subscription = subscriptions[key];

        // The subscription may have been removed during this event loop.
        if (subscription) {
          this._currentSubscription = subscription;
          subscription.listener.apply(
            subscription.context,
            Array.prototype.slice.call(arguments, 1)
          );
        }
      }
      this._currentSubscription = null;
    }
  }
}

module.exports = EventEmitter;
