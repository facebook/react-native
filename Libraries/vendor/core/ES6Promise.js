/**
 * @generated SignedSource<<d169e3bbcd91c2e26877882e0d02f289>>
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
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ES6Promise
 *
 * This module implements the minimum functionality necessary to comply
 * with chapter 25.4 of the ES6 specification. Any extensions to Promise
 * or Promise.prototype should be added in the Promise module.
 *
 * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-objects
 */

module.exports = (function(global, undefined) {
  'use strict';

  var setImmediate = require('setImmediate');

  // These are the possible values for slots(promise).state.
  var PENDING_STATE = 'pending';
  var FULFILLED_STATE = 'fulfilled';
  var REJECTED_STATE = 'rejected';

  // The ES6 specification makes heavy use of a notion of internal slots.
  // Some of these slots are best implemented as closure variables, such
  // as the alreadySettled variable in createResolvingFunctions, which
  // corresponds to the resolve.[[AlreadyResolved]].value property in the
  // specification. Other slots are best implemented as properties of a
  // slots object attached to the host object by a pseudo-private
  // property. The latter kind of slots may be accessed by passing the
  // host object (such as a Promise or a resolve/reject function object)
  // to the slots function; e.g., the slots(promise).state slot, which
  // corresponds to promise.[[PromiseState]] in the specification.
  var slotsKey = '__slots$' + Math.random().toString(36).slice(2);
  function slots(obj) {
    var result = obj[slotsKey];
    if (!result) {
      // In ES5+ environments, this property will be safely non-writable,
      // non-configurable, and non-enumerable. This implementation does
      // not logically rely on those niceties, however, so this code works
      // just fine in pre-ES5 environments, too.
      obj[slotsKey] = result = {};
      if (Object.defineProperty) try {
        Object.defineProperty(obj, slotsKey, { value: result });
      } catch (definePropertyIsBrokenInIE8) {}
    }
    return result;
  }

  // Reusable callback functions. The identify function is the default
  // when onFulfilled is undefined or null, and the raise function is the
  // default when onRejected is undefined or null.
  function identity(x) { return x; }
  function raise(x) { throw x; }

  /**
   * When the Promise function is called with argument executor, the
   * following steps are taken:
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise
   *
   * The executor argument must be a function object. It is called for
   * initiating and reporting completion of the possibly deferred action
   * represented by this Promise object. The executor is called with two
   * arguments: resolve and reject. These are functions that may be used
   * by the executor function to report eventual completion or failure of
   * the deferred computation. Returning from the executor function does
   * not mean that the deferred action has been completed, but only that
   * the request to eventually perform the deferred action has been
   * accepted.
   *
   * The resolve function that is passed to an executor function accepts a
   * single argument. The executor code may eventually call the resolve
   * function to indicate that it wishes to resolve the associated Promise
   * object. The argument passed to the resolve function represents the
   * eventual value of the deferred action and can be either the actual
   * fulfillment value or another Promise object which will provide the
   * value if it is fullfilled.
   *
   * The reject function that is passed to an executor function accepts a
   * single argument. The executor code may eventually call the reject
   * function to indicate that the associated Promise is rejected and will
   * never be fulfilled. The argument passed to the reject function is
   * used as the rejection value of the promise. Typically it will be an
   * Error object.
   *
   * When Promise is called as a function rather than as a constructor, it
   * initializes its this value with the internal state necessary to
   * support the Promise.prototype methods.
   *
   * The Promise constructor is designed to be subclassable. It may be
   * used as the value in an extends clause of a class
   * definition. Subclass constructors that intend to inherit the
   * specified Promise behaviour must include a super call to Promise,
   * e.g. by invoking Promise.call(this, executor).
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-constructor
   */
  function Promise(executor) {
    var promiseSlots = slots(this);
    promiseSlots.state = PENDING_STATE;
    promiseSlots.fulfillReactions = [];
    promiseSlots.rejectReactions = [];

    var resolvingFunctions = createResolvingFunctions(this);
    var reject = resolvingFunctions.reject;

    try {
      executor(resolvingFunctions.resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  function createResolvingFunctions(promise) {
    var alreadySettled = false;

    return {
      resolve: function(resolution) {
        if (!alreadySettled) {
          alreadySettled = true;

          if (resolution === promise) {
            return settlePromise(
              promise,
              REJECTED_STATE,
              new TypeError('Cannot resolve promise with itself')
            );
          }

          // To be treated as a Promise-like object, the resolution only
          // needs to be an object with a callable .then method.
          if (!resolution ||
              typeof resolution !== "object" ||
              typeof resolution.then !== "function") {
            return settlePromise(promise, FULFILLED_STATE, resolution);
          }

          var resolvingFunctions = createResolvingFunctions(promise);
          var reject = resolvingFunctions.reject;

          try {
            resolution.then(resolvingFunctions.resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      },

      reject: function(reason) {
        if (!alreadySettled) {
          alreadySettled = true;
          settlePromise(promise, REJECTED_STATE, reason);
        }
      }
    };
  }

  // This function unifies the FulfillPromise and RejectPromise functions
  // defined in the ES6 specification.
  function settlePromise(promise, state, result) {
    var promiseSlots = slots(promise);
    if (promiseSlots.state !== PENDING_STATE) {
      throw new Error('Settling a ' + promiseSlots.state + ' promise');
    }

    var reactions;
    if (state === FULFILLED_STATE) {
      reactions = promiseSlots.fulfillReactions;
    } else if (state === REJECTED_STATE) {
      reactions = promiseSlots.rejectReactions;
    }

    promiseSlots.result = result;
    promiseSlots.fulfillReactions = undefined;
    promiseSlots.rejectReactions = undefined;
    promiseSlots.state = state;

    var count = reactions.length;
    count && setImmediate(function() {
      for (var i = 0; i < count; ++i) {
        reactions[i](promiseSlots.result);
      }
    });
  }

  /**
   * The Promise.all function returns a new promise which is fulfilled
   * with an array of fulfillment values for the passed promises, or
   * rejects with the reason of the first passed promise that rejects. It
   * resoves all elements of the passed iterable to promises as it runs
   * this algorithm.
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.all
   */
  Promise.all = function(array) {
    var Promise = this;
    return new Promise(function(resolve, reject) {
      var results = [];
      var remaining = 0;
      array.forEach(function(element, index) {
        ++remaining; // Array might be sparse.
        Promise.resolve(element).then(function(result) {
          if (!results.hasOwnProperty(index)) {
            results[index] = result;
            --remaining || resolve(results);
          }
        }, reject);
      });
      remaining || resolve(results);
    });
  };

  /**
   * The Promise.race function returns a new promise which is settled in
   * the same way as the first passed promise to settle. It resolves all
   * elements of the passed iterable to promises as it runs this
   * algorithm.
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.race
   */
  Promise.race = function(array) {
    var Promise = this;
    return new Promise(function(resolve, reject) {
      array.forEach(function(element) {
        Promise.resolve(element).then(resolve, reject);
      });
    });
  };

  /**
   * The Promise.resolve function returns either a new promise resolved
   * with the passed argument, or the argument itself if the argument a
   * promise produced by this construtor.
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.resolve
   */
  Promise.resolve = function(x) {
    return x instanceof Promise && x.constructor === this
      ? x // Refuse to create promises for promises.
      : new this(function(resolve) { resolve(x); });
  };

  /**
   * The Promise.reject function returns a new promise rejected with the
   * passed argument.
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.reject
   */
  Promise.reject = function(r) {
    return new this(function(_, reject) { reject(r); });
  };

  var Pp = Promise.prototype;

  /**
   * When the .then method is called with arguments onFulfilled and
   * onRejected, the following steps are taken:
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.prototype.then
   */
  Pp.then = function(onFulfilled, onRejected) {
    var capabilityResolve;
    var capabilityReject;
    var capabilityPromise = new this.constructor(function(resolve, reject) {
      capabilityResolve = resolve;
      capabilityReject = reject;
    });

    if (typeof capabilityResolve !== "function") {
      throw new TypeError('Uncallable Promise resolve function');
    }

    if (typeof capabilityReject !== "function") {
      throw new TypeError('Uncallable Promise reject function');
    }

    if (onFulfilled === undefined || onFulfilled === null) {
      onFulfilled = identity;
    }

    if (onRejected === undefined || onRejected === null) {
      onRejected = raise;
    }

    var promiseSlots = slots(this);
    var state = promiseSlots.state;
    if (state === PENDING_STATE) {
      promiseSlots.fulfillReactions.push(makeReaction(
        capabilityResolve,
        capabilityReject,
        onFulfilled
      ));

      promiseSlots.rejectReactions.push(makeReaction(
        capabilityResolve,
        capabilityReject,
        onRejected
      ));

    } else if (state === FULFILLED_STATE || state === REJECTED_STATE) {
      setImmediate(makeReaction(
        capabilityResolve,
        capabilityReject,
        state === FULFILLED_STATE ? onFulfilled : onRejected,
        promiseSlots.result
      ));
    }

    return capabilityPromise;
  };

  function makeReaction(resolve, reject, handler, argument) {
    var hasArgument = arguments.length > 3;
    return function(result) {
      try {
        result = handler(hasArgument ? argument : result);
      } catch (err) {
        reject(err);
        return;
      }
      resolve(result);
    };
  }

  /**
   * When the .catch method is called with argument onRejected, the
   * following steps are taken:
   *
   * people.mozilla.org/~jorendorff/es6-draft.html#sec-promise.prototype.catch
   */
  Pp['catch'] = function(onRejected) {
    return this.then(undefined, onRejected);
  };

  Pp.toString = function() {
    return '[object Promise]';
  };

  return Promise;
}(/* jslint evil: true */ Function('return this')()));
