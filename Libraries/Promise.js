/**
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
 * implementation provided by the promise npm package.
 */

'use strict';

global.setImmediate = require('setImmediate');
var Promise = require('promise/setimmediate/es6-extensions');
require('promise/setimmediate/done');
if (__DEV__) {
  require('promise/setimmediate/rejection-tracking').enable({
    allRejections: true,
    onUnhandled: (id, error) => {
      const {message, stack} = error;
      const warning =
        `Possible Unhandled Promise Rejection (id: ${id}):\n` +
        (message == null ? '' : `${message}\n`) +
        (stack == null ? '' : stack);
      console.warn(warning);
    },
    onHandled: (id) => {
      const warning =
        `Promise Rejection Handled (id: ${id})\n` +
        'This means you can ignore any previous messages of the form ' +
        `"Possible Unhandled Promise Rejection (id: ${id}):"`;
      console.warn(warning);
    },
  });
}

/**
 * Handle either fulfillment or rejection with the same callback.
 */
Promise.prototype.finally = function(onSettled) {
  return this.then(onSettled, onSettled);
};


module.exports = Promise;
