/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Subscribable
 * @flow
 */
'use strict';

/**
 * Subscribable wraps EventEmitter in a clean interface, and provides a mixin
 * so components can easily subscribe to events and not worry about cleanup on
 * unmount.
 *
 * Also acts as a basic store because it records the last data that it emitted,
 * and provides a way to populate the initial data. The most recent data can be
 * fetched from the Subscribable by calling `get()`
 *
 * Advantages over EventEmitter + Subscibable.Mixin.addListenerOn:
 *  - Cleaner usage: no strings to identify the event
 *  - Lifespan pattern enforces cleanup
 *  - More logical: Subscribable.Mixin now uses a Subscribable class
 *  - Subscribable saves the last data and makes it available with `.get()`
 *
 * Legacy Subscribable.Mixin.addListenerOn allowed automatic subscription to
 * EventEmitters. Now we should avoid EventEmitters and wrap with Subscribable
 * instead:
 *
 * ```
 * AppState.networkReachability = new Subscribable(
 *   RCTDeviceEventEmitter,
 *   'reachabilityDidChange',
 *   (resp) => resp.network_reachability,
 *   RCTReachability.getCurrentReachability
 * );
 *
 * var myComponent = React.createClass({
 *   mixins: [Subscribable.Mixin],
 *   getInitialState: function() {
 *     return {
 *       isConnected: AppState.networkReachability.get() !== 'none'
 *     };
 *   },
 *   componentDidMount: function() {
 *     this._reachSubscription = this.subscribeTo(
 *       AppState.networkReachability,
 *       (reachability) => {
 *         this.setState({ isConnected: reachability !== 'none' })
 *       }
 *     );
 *   },
 *   render: function() {
 *     return (
 *       <Text>
 *         {this.state.isConnected ? 'Network Connected' : 'No network'}
 *       </Text>
 *       <Text onPress={() => this._reachSubscription.remove()}>
 *         End reachability subscription
 *       </Text>
 *     );
 *   }
 * });
 * ```
 */

var EventEmitter = require('EventEmitter');

var invariant = require('invariant');
var logError = require('logError');

var SUBSCRIBABLE_INTERNAL_EVENT = 'subscriptionEvent';

type Data = Object;
type EventMapping = (_: Data) => Data;

class Subscribable {
  _eventMapping: EventMapping;
  _lastData: Data;

  /**
   * Creates a new Subscribable object
   *
   * @param {EventEmitter} eventEmitter Emitter to trigger subscription events.
   * @param {string} eventName Name of emitted event that triggers subscription
   *   events.
   * @param {function} eventMapping (optional) Function to convert the output
   *   of the eventEmitter to the subscription output.
   * @param {function} getInitData (optional) Async function to grab the initial
   *   data to publish. Signature `function(successCallback, errorCallback)`.
   *   The resolved data will be transformed with the eventMapping before it
   *   gets emitted.
   */
  constructor(eventEmitter: EventEmitter, eventName: string, eventMapping?: EventMapping, getInitData?: Function) {

    this._internalEmitter = new EventEmitter();
    this._eventMapping = eventMapping || (data => data);

    this._upstreamSubscription = eventEmitter.addListener(
      eventName,
      this._handleEmit,
      this
    );

    // Asyncronously get the initial data, if provided
    getInitData && getInitData(this._handleInitData.bind(this), logError);
  }

  /**
   * Returns the last data emitted from the Subscribable, or undefined
   */
  get(): Data {
    return this._lastData;
  }

  /**
   * Unsubscribe from the upstream EventEmitter
   */
  cleanup() {
    this._upstreamSubscription && this._upstreamSubscription.remove();
  }

  /**
   * Add a new listener to the subscribable. This should almost never be used
   * directly, and instead through Subscribable.Mixin.subscribeTo
   *
   * @param {object} lifespan Object with `addUnmountCallback` that accepts
   *   a handler to be called when the component unmounts. This is required and
   *   desirable because it enforces cleanup. There is no easy way to leave the
   *   subsciption hanging
   *   {
   *     addUnmountCallback: function(newUnmountHanlder) {...},
   *   }
   * @param {function} callback Handler to call when Subscribable has data
   *   updates
   * @param {object} context Object to bind the handler on, as "this"
   *
   * @return {object} the subscription object:
   *   {
   *     remove: function() {...},
   *   }
   *   Call `remove` to terminate the subscription before unmounting
   */
    subscribe(lifespan: { addUnmountCallback: Function }, callback: Function, context: Object) {
    invariant(
      typeof lifespan.addUnmountCallback === 'function',
      'Must provide a valid lifespan, which provides a way to add a ' +
      'callback for when subscription can be cleaned up. This is used ' +
      'automatically by Subscribable.Mixin'
    );
    invariant(
      typeof callback === 'function',
      'Must provide a valid subscription handler.'
    );

    // Add a listener to the internal EventEmitter
    var subscription = this._internalEmitter.addListener(
      SUBSCRIBABLE_INTERNAL_EVENT,
      callback,
      context
    );

    // Clean up subscription upon the lifespan unmount callback
    lifespan.addUnmountCallback(() => {
      subscription.remove();
    });

    return subscription;
  }

  /**
   * Callback for the initial data resolution. Currently behaves the same as
   * `_handleEmit`, but we may eventually want to keep track of the difference
   */
  _handleInitData(dataInput: Data) {
    var emitData = this._eventMapping(dataInput);
    this._lastData = emitData;
    this._internalEmitter.emit(SUBSCRIBABLE_INTERNAL_EVENT, emitData);
  }

  /**
   * Handle new data emissions. Pass the data through our eventMapping
   * transformation, store it for later `get()`ing, and emit it for subscribers
   */
  _handleEmit(dataInput: Data) {
    var emitData = this._eventMapping(dataInput);
    this._lastData = emitData;
    this._internalEmitter.emit(SUBSCRIBABLE_INTERNAL_EVENT, emitData);
  }
}


Subscribable.Mixin = {

  /**
   * @return {object} lifespan Object with `addUnmountCallback` that accepts
   *   a handler to be called when the component unmounts
   *   {
   *     addUnmountCallback: function(newUnmountHanlder) {...},
   *   }
   */
  _getSubscribableLifespan: function() {
    if (!this._subscribableLifespan) {
      this._subscribableLifespan = {
        addUnmountCallback: (cb) => {
          this._endSubscribableLifespanCallbacks.push(cb);
        },
      };
    }
    return this._subscribableLifespan;
  },

  _endSubscribableLifespan: function() {
    this._endSubscribableLifespanCallbacks.forEach(cb => cb());
  },

  /**
   * Components use `subscribeTo` for listening to Subscribable stores. Cleanup
   * is automatic on component unmount.
   *
   * To stop listening to the subscribable and end the subscription early,
   * components should store the returned subscription object and invoke the
   * `remove()` function on it
   *
   * @param {Subscribable} subscription to subscribe to.
   * @param {function} listener Function to invoke when event occurs.
   * @param {object} context Object to bind the handler on, as "this"
   *
   * @return {object} the subscription object:
   *   {
   *     remove: function() {...},
   *   }
   *   Call `remove` to terminate the subscription before unmounting
   */
  subscribeTo: function(subscribable, handler, context) {
    invariant(
      subscribable instanceof Subscribable,
      'Must provide a Subscribable'
    );
    return subscribable.subscribe(
      this._getSubscribableLifespan(),
      handler,
      context
    );
  },

  /**
   * Gets a Subscribable store, scoped to the component, that can be passed to
   * children. The component will automatically clean up the subscribable's
   * subscription to the eventEmitter when unmounting.
   *
   * `provideSubscribable` will always return the same Subscribable for any
   * particular emitter/eventName combo, so it can be called directly from
   * render, and it will never create duplicate Subscribables.
   *
   * @param {EventEmitter} eventEmitter Emitter to trigger subscription events.
   * @param {string} eventName Name of emitted event that triggers subscription
   *   events.
   * @param {function} eventMapping (optional) Function to convert the output
   *   of the eventEmitter to the subscription output.
   * @param {function} getInitData (optional) Async function to grab the initial
   *   data to publish. Signature `function(successCallback, errorCallback)`.
   *   The resolved data will be transformed with the eventMapping before it
   *   gets emitted.
   */
  provideSubscribable: function(eventEmitter, eventName, eventMapping, getInitData) {
    this._localSubscribables = this._localSubscribables || {};
    this._localSubscribables[eventEmitter] =
      this._localSubscribables[eventEmitter] || {};
    if (!this._localSubscribables[eventEmitter][eventName]) {
      this._localSubscribables[eventEmitter][eventName] =
        new Subscribable(eventEmitter, eventName, eventMapping, getInitData);
    }
    return this._localSubscribables[eventEmitter][eventName];
  },

  /**
   * Removes any local Subscribables created with `provideSubscribable`, so the
   * component can unmount without leaving any dangling listeners on
   * eventEmitters
   */
  _cleanupLocalSubscribables: function() {
    if (!this._localSubscribables) {
      return;
    }
    Object.keys(this._localSubscribables).forEach((eventEmitter) => {
      var emitterSubscribables = this._localSubscribables[eventEmitter];
      if (emitterSubscribables) {
        Object.keys(emitterSubscribables).forEach((eventName) => {
          emitterSubscribables[eventName].cleanup();
        });
      }
    });
    this._localSubscribables = null;
  },

  componentWillMount: function() {
    this._endSubscribableLifespanCallbacks = [];

    // DEPRECATED addListenerOn* usage:
    this._subscribableSubscriptions = [];
  },

  componentWillUnmount: function() {
    // Resolve the lifespan, which will cause Subscribable to clean any
    // remaining subscriptions
    this._endSubscribableLifespan && this._endSubscribableLifespan();

    this._cleanupLocalSubscribables();

    // DEPRECATED addListenerOn* usage uses _subscribableSubscriptions array
    // instead of lifespan
    this._subscribableSubscriptions.forEach(
      (subscription) => subscription.remove()
    );
    this._subscribableSubscriptions = null;
  },

  /**
   * DEPRECATED - Use `Subscribable` and `Mixin.subscribeTo` instead.
   * `addListenerOn` subscribes the component to an `EventEmitter`.
   *
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
    this._subscribableSubscriptions.push(
      eventEmitter.addListener(eventType, listener, context)
    );
  }
};

module.exports = Subscribable;
