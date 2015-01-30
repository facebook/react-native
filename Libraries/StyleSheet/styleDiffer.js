/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule styleDiffer
 */
'use strict';

var deepDiffer = require('deepDiffer');

function styleDiffer(a, b) {
  return !styleEqual(a, b);
}

function styleEqual(a, b) {
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
