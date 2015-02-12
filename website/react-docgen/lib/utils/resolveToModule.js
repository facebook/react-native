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

var match = require('./match');
var resolveToValue = require('./resolveToValue');
var types = require('recast').types.namedTypes;

/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
function resolveToModule(path: NodePath): ?string {
  var node = path.node;
  switch (node.type) {
    case types.VariableDeclarator.name:
      if (node.init) {
        return resolveToModule(path.get('init'));
      }
      break;
    case types.CallExpression.name:
      if (match(node.callee, {type: types.Identifier.name, name: 'require'})) {
        return node['arguments'][0].value;
      }
      return resolveToModule(path.get('callee'));
    case types.Identifier.name:
      var valuePath = resolveToValue(path);
      if (valuePath !== path) {
        return resolveToModule(valuePath);
      }
      break;
    case types.MemberExpression.name:
      while (path && types.MemberExpression.check(path.node)) {
        path = path.get('object');
      }
      if (path) {
        return resolveToModule(path);
      }
  }
}

module.exports = resolveToModule;
