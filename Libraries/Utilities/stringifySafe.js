/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

/**
 * Tries to stringify with JSON.stringify and toString, but catches exceptions
 * (e.g. from circular objects) and always returns a string and never throws.
 */
function stringifySafe(arg: any): string {
  let ret;
  const type = typeof arg;
  if (arg === undefined) {
    ret = 'undefined';
  } else if (arg === null) {
    ret = 'null';
  } else if (type === 'string') {
    ret = '"' + arg + '"';
  } else if (type === 'function') {
    try {
      ret = arg.toString();
    } catch (e) {
      ret = '[function unknown]';
    }
  } else if (arg instanceof Error) {
    ret = arg.name + ': ' + arg.message;
  } else {
    // Perform a try catch, just in case the object has a circular
    // reference or stringify throws for some other reason.
    try {
      ret = JSON.stringify(arg);
    } catch (e) {
      if (typeof arg.toString === 'function') {
        try {
          ret = arg.toString();
        } catch (E) {}
      }
    }
  }
  return ret || '["' + type + '" failed to stringify]';
}

module.exports = stringifySafe;
