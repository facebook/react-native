/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global exports:true*/
/*jslint node:true*/
'use strict';

var Syntax = require('./syntax');

/**
 * Executes visitor on the object and its children (recursively).
 * While traversing the tree, a scope chain is built and passed to the visitor.
 *
 * If the visitor returns false, the object's children are not traversed.
 *
 * @param {object} object
 * @param {function} visitor
 * @param {?array} scopeChain
 */
function traverse(object, visitor, scopeChain) {
  scopeChain = scopeChain || [{}];

  var scope = scopeChain[0];

  switch (object.type) {
    case Syntax.VariableDeclaration:
      object.declarations.forEach(function(decl) {
        scope[decl.id.name] = decl.init;
      });
      break;
    case Syntax.ClassDeclaration:
      scope[object.id.name] = object;
      break;
    case Syntax.FunctionDeclaration:
      // A function declaration creates a symbol in the current scope
      scope[object.id.name] = object;
      /* falls through */
    case Syntax.FunctionExpression:
    case Syntax.Program:
      scopeChain = [{}].concat(scopeChain);
      break;
  }

  if (object.type === Syntax.FunctionExpression ||
      object.type === Syntax.FunctionDeclaration) {
    // add parameters to the new scope
    object.params.forEach(function(param) {
      // since the value of the parameters are  unknown during parsing time
      // we set the value to `undefined`.
      scopeChain[0][param.name] = undefined;
    });
  }

  if (object.type) {
    if (visitor.call(null, object, scopeChain) === false) {
      return;
    }
  }

  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      var child = object[key];
      if (typeof child === 'object' && child !== null) {
        traverse(child, visitor, scopeChain);
      }
    }
  }
}

/**
 * Executes visitor on the object and its children, but only traverses into
 * children which can be statically analyzed and don't depend on runtime
 * information.
 *
 * @param {object} object
 * @param {function} visitor
 * @param {?array} scopeChain
 */
function traverseFlat(object, visitor, scopeChain) {
  traverse(object, function(node, scopeChain) {
    switch (node.type) {
      case Syntax.FunctionDeclaration:
      case Syntax.FunctionExpression:
      case Syntax.IfStatement:
      case Syntax.WithStatement:
      case Syntax.SwitchStatement:
      case Syntax.TryStatement:
      case Syntax.WhileStatement:
      case Syntax.DoWhileStatement:
      case Syntax.ForStatement:
      case Syntax.ForInStatement:
        return false;
    }
    return visitor(node, scopeChain);
  }, scopeChain);
}

module.exports = traverseFlat;
