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

var types = require('recast').types.namedTypes;

/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
function getNameOrValue(path: NodePath, raw?: boolean): string {
  var node = path.node;
  switch (node.type) {
    case types.Identifier.name:
      return node.name;
    case types.Literal.name:
      return raw ? node.raw : node.value;
    default:
      throw new TypeError('Argument must be an Identifier or a Literal');
  }
}

module.exports = getNameOrValue;
