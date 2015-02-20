/**
 * @generated SignedSource<<a34c32acc93f914fafb29ca64341d514>>
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
 * @providesModule Promise
 *
 * This module wraps and augments the minimally ES6-compliant Promise
 * implementation provided by the ES6Promise module.
 */

var Promise = require('ES6Promise');
var Pp = Promise.prototype;

var invariant = require('invariant');
var setImmediate = require('setImmediate');
var throwImmediate = require('throwImmediate');

/**
 * Handle either fulfillment or rejection with the same callback.
 */
Pp.finally = function(onSettled) {
  return this.then(onSettled, onSettled);
};

/**
 * Throw any unhandled error in a separate tick of the event loop.
 */
Pp.done = function(onFulfilled, onRejected) {
  this.then(onFulfilled, onRejected).then(null, throwImmediate);
};

/**
 * This function takes an object with promises as keys and returns a promise.
 * The returned promise is resolved when all promises from the object are
 * resolved and gets rejected when the first promise is rejected.
 *
 * EXAMPLE:
 *   var promisedMuffin = Promise.allObject({
 *     dough: promisedDough,
 *     frosting: promisedFrosting
 *   }).then(function(results) {
 *     return combine(results.dough, results.frosting);
 *   });
 */
Promise.allObject = function(/*object*/ promises) {
  // Throw instead of warn here to make sure people use this only with object.
  invariant(
    !Array.isArray(promises),
    'expected an object, got an array instead'
  );

  var keys = Object.keys(promises);
  return Promise.all(keys.map(function(key) {
    return promises[key];
  })).then(function(values) {
    var answers = {};
    values.forEach(function(value, i) {
      answers[keys[i]] = value;
    });
    return answers;
  });
};

module.exports = Promise;
