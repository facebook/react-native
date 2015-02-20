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

var Documentation = require('../Documentation');

var n = require('recast').types.namedTypes;
var getDocblock = require('../utils/docblock').getDocblock;

/**
 * Finds the nearest block comment before the component definition.
 */
function componentDocblockHandler(
  documentation: Documentation,
  path: NodePath
) {
  var description = '';
  // Find parent statement (e.g. var Component = React.createClass(path);)
  while (path && !n.Statement.check(path.node)) {
    path = path.parent;
  }
  if (path) {
    description = getDocblock(path) || '';
  }
  documentation.setDescription(description);
}

module.exports = componentDocblockHandler;
