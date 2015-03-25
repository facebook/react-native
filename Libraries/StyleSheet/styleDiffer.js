/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule styleDiffer
 * @flow
 */
'use strict';

var deepDiffer = require('deepDiffer');

function styleDiffer(a: any, b: any): bool {
  return !styleEqual(a, b);
}

function styleEqual(a: any, b: any): bool {
  if (!a) {
    return !b;
  }
  if (!b) {
    return !a;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === 'number') {
    return a === b;
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; ++i) {
      if (!styleEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  for (var key in a) {
    if (deepDiffer(a[key], b[key])) {
      return false;
    }
  }

  for (var key in b) {
    if (!a.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}

module.exports = styleDiffer;
