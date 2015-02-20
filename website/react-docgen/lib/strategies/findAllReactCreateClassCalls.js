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

var isReactCreateClassCall = require('../utils/isReactCreateClassCall');
var resolveToValue = require('../utils/resolveToValue');

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
function findAllReactCreateClassCalls(
  ast: ASTNode,
  recast: Object
): Array<NodePath> {
  var types = recast.types.namedTypes;
  var definitions = [];

  recast.visit(ast, {
    visitCallExpression: function(path) {
      if (!isReactCreateClassCall(path)) {
        return false;
      }
      // We found React.createClass. Lets get cracking!
      var resolvedPath = resolveToValue(path.get('arguments', 0));
      if (types.ObjectExpression.check(resolvedPath.node)) {
        definitions.push(resolvedPath);
      }
      return false;
    }
  });

  return definitions;
}

module.exports = findAllReactCreateClassCalls;
