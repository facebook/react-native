/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Promise
 * @flow
 */
'use strict';

const Promise = require('fbjs/lib/Promise.native');

const prettyFormat = require('pretty-format');

if (__DEV__) {
  require('promise/setimmediate/rejection-tracking').enable({
    allRejections: true,
    onUnhandled: (id, error = {}) => {
      let message: string;
      let stack: ?string;

      const stringValue = Object.prototype.toString.call(error);
      if (stringValue === '[object Error]') {
        message = Error.prototype.toString.call(error);
        stack = error.stack;
      } else {
        message = prettyFormat(error);
      }

      const warning =
        `Possible Unhandled Promise Rejection (id: ${id}):\n` +
        `${message}\n` +
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

module.exports = Promise;
