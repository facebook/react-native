/**
 * @generated SignedSource<<c735038726af2daf584b3e7fb3950e8b>>
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
 * @providesModule mixInEventEmitter
 */

var EventEmitter = require('EventEmitter');
var EventEmitterWithHolding = require('EventEmitterWithHolding');
var EventHolder = require('EventHolder');
var EventValidator = require('EventValidator');

var copyProperties = require('copyProperties');
var invariant = require('invariant');
var keyOf = require('keyOf');

var TYPES_KEY = keyOf({__types: true});

/**
 * API to setup an object or constructor to be able to emit data events.
 *
 * @example
 * function Dog() { ...dog stuff... }
 * mixInEventEmitter(Dog, {bark: true});
 *
 * var puppy = new Dog();
 * puppy.addListener('bark', function (volume) {
 *   console.log('Puppy', this, 'barked at volume:', volume);
 * });
 * puppy.emit('bark', 'quiet');
 * // Puppy <puppy> barked at volume: quiet
 *
 *
 * // A "singleton" object may also be commissioned:
 *
 * var Singleton = {};
 * mixInEventEmitter(Singleton, {lonely: true});
 * Singleton.emit('lonely', true);
 */
function mixInEventEmitter(klass, types) {
  invariant(types, 'Must supply set of valid event types');
  invariant(!this.__eventEmitter, 'An active emitter is already mixed in');

  // If this is a constructor, write to the prototype, otherwise write to the
  // singleton object.
  var target = klass.prototype || klass;

  var ctor = klass.constructor;
  if (ctor) {
    invariant(
      ctor === Object || ctor === Function,
      'Mix EventEmitter into a class, not an instance'
    );
  }

  // Keep track of the provided types, union the types if they already exist,
  // which allows for prototype subclasses to provide more types.
  if (target.hasOwnProperty(TYPES_KEY)) {
    copyProperties(target.__types, types);
  } else if (target.__types) {
    target.__types = copyProperties({}, target.__types, types);
  } else {
    target.__types = types;
  }
  copyProperties(target, EventEmitterMixin);
}

var EventEmitterMixin = {
  emit: function(eventType, a, b, c, d, e, _) {
    return this.__getEventEmitter().emit(eventType, a, b, c, d, e, _);
  },

  emitAndHold: function(eventType, a, b, c, d, e, _) {
    return this.__getEventEmitter().emitAndHold(eventType, a, b, c, d, e, _);
  },

  addListener: function(eventType, listener, context) {
    return this.__getEventEmitter().addListener(eventType, listener, context);
  },

  once: function(eventType, listener, context) {
    return this.__getEventEmitter().once(eventType, listener, context);
  },

  addRetroactiveListener: function(eventType, listener, context) {
    return this.__getEventEmitter().addRetroactiveListener(
      eventType,
      listener,
      context
    );
  },

  addListenerMap: function(listenerMap, context) {
    return this.__getEventEmitter().addListenerMap(listenerMap, context);
  },

  addRetroactiveListenerMap: function(listenerMap, context) {
    return this.__getEventEmitter().addListenerMap(listenerMap, context);
  },

  removeAllListeners: function() {
    this.__getEventEmitter().removeAllListeners();
  },

  removeCurrentListener: function() {
    this.__getEventEmitter().removeCurrentListener();
  },

  releaseHeldEventType: function(eventType) {
    this.__getEventEmitter().releaseHeldEventType(eventType);
  },

  __getEventEmitter: function() {
    if (!this.__eventEmitter) {
      var emitter = new EventEmitter();
      emitter = EventValidator.addValidation(emitter, this.__types);

      var holder = new EventHolder();
      this.__eventEmitter = new EventEmitterWithHolding(emitter, holder);
    }
    return this.__eventEmitter;
  }
};

module.exports = mixInEventEmitter;
