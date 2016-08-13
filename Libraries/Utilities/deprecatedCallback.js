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

module.exports = function(promise: Promise<any>, callbacks: Array<Function>, type: string, warning: string): Promise<any> {
  if (callbacks.length === 0) {
    return promise;
  }

  let success, error, callback;

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
  case 'single-callback-value-first': // handles func(callback(value, err))
    [ callback ] = callbacks;
    return promise.then(
      res => callback(res),
      err => callback(null, err)
    );
  case 'node': // handles func(callback(err, value))
    [ callback ] = callbacks;
    return promise.then(
      res => callback(null, res),
      err => callback(err)
    );
  default:
    throw new Error('Type of callbacks not specified. Must be one of \'success-first\', \'error-first\', \'single-callback-value-first\', or \'node\'');
  }
};
