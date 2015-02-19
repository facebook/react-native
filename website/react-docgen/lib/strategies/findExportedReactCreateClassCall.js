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

var isExportsOrModuleAssignment =
  require('../utils/isExportsOrModuleAssignment');
var isReactCreateClassCall = require('../utils/isReactCreateClassCall');
var resolveToValue = require('../utils/resolveToValue');

var ERROR_MULTIPLE_DEFINITIONS =
  'Multiple exported component definitions found.';

function ignore() {
  return false;
}

/**
 * Given an AST, this function tries to find the object expression that is
 * passed to `React.createClass`, by resolving all references properly.
 */
function findExportedReactCreateClass(
  ast: ASTNode,
  recast: Object
): ?NodePath {
  var types = recast.types.namedTypes;
  var definition;

  recast.visit(ast, {
    visitFunctionDeclaration: ignore,
    visitFunctionExpression: ignore,
    visitIfStatement: ignore,
    visitWithStatement: ignore,
    visitSwitchStatement: ignore,
    visitCatchCause: ignore,
    visitWhileStatement: ignore,
    visitDoWhileStatement: ignore,
    visitForStatement: ignore,
    visitForInStatement: ignore,
    visitAssignmentExpression: function(path) {
      // Ignore anything that is not `exports.X = ...;` or
      // `module.exports = ...;`
      if (!isExportsOrModuleAssignment(path)) {
        return false;
      }
      // Resolve the value of the right hand side. It should resolve to a call
      // expression, something like React.createClass
      path = resolveToValue(path.get('right'));
      if (!isReactCreateClassCall(path)) {
        return false;
      }
      if (definition) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
      }
      // We found React.createClass. Lets get cracking!
      var resolvedPath = resolveToValue(path.get('arguments', 0));
      if (types.ObjectExpression.check(resolvedPath.node)) {
        definition = resolvedPath;
      }
      return false;
    }
  });

  return definition;
}

module.exports = findExportedReactCreateClass;
