/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Helper for deprecated callback pattern
 *
 * @providesModule deprecatedCallback
 * @flow
 */

'use strict';

module.exports = function(promise: Promise, callbacks: Array<Function>, type: string, warning: string): Promise {
  if (callbacks.length === 0) {
    return promise;
  }

  let success, error;

  console.warn(warning);

  switch (type) {
  case 'success-first': // handles func(success, error), func(success)
    [ success, error ] = callbacks;
    return promise.then(
      res => success(res),
      err => error && error(err)
    );
  case 'error-first': // handles func(error, success)
    [ error, success ] = callbacks;
    return promise.then(
      res => success(res),
      err => error(err)
    );
  case 'node': // handles func(callback)
    const [ callback ] = callbacks;
    return promise.then(
      res => callback(null, res),
      err => callback(err)
    );
  default:
    throw new Error(`Type of callbacks not specified. Must be one of 'success-first', 'error-first', or 'node'`);
  }
};
