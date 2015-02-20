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

var isReactModuleName = require('./isReactModuleName');
var match = require('./match');
var resolveToModule = require('./resolveToModule');
var types = require('recast').types.namedTypes;

/**
 * Returns true if the expression is a function call of the form
 * `React.createClass(...)`.
 */
function isReactCreateClassCall(path: NodePath): boolean {
  if (types.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, {callee: {property: {name: 'createClass'}}})) {
    return false;
  }
  var module = resolveToModule(path.get('callee', 'object'));
  return module && isReactModuleName(module);
}

module.exports = isReactCreateClassCall;
