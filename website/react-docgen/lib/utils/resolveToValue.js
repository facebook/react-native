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
 * If the path is an identifier, it is resolved in the scope chain.
 * If it is an assignment expression, it resolves to the right hand side.
 *
 * Else the path itself is returned.
 */
function resolveToValue(path: NodePath): NodePath {
  var node = path.node;
  if (types.AssignmentExpression.check(node)) {
    if (node.operator === '=') {
      return resolveToValue(node.get('right'));
    }
  } else if (types.Identifier.check(node)) {
    var scope = path.scope.lookup(node.name);
    if (scope) {
      var bindings = scope.getBindings()[node.name];
      if (bindings.length > 0) {
        var parentPath = scope.getBindings()[node.name][0].parent;
        if (types.VariableDeclarator.check(parentPath.node)) {
          parentPath = parentPath.get('init');
        }
        return resolveToValue(parentPath);
      }
    }
  }
  return path;
}

module.exports = resolveToValue;
