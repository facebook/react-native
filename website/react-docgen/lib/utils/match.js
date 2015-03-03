/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

/**
 * This function takes an AST node and matches it against "pattern". Pattern
 * is simply a (nested) object literal and it is traversed to see whether node
 * contains those (nested) properties with the provided values.
 */
function match(node: ASTNOde, pattern: Object): boolean {
  if (!node) {
    return false;
  }
  for (var prop in pattern) {
    if (!node[prop]) {
      return false;
    }
    if (pattern[prop] && typeof pattern[prop] === 'object') {
      if (!match(node[prop], pattern[prop])) {
        return false;
      }
    } else if (node[prop] !== pattern[prop]) {
      return false;
    }
  }
  return true;
}

module.exports = match;
