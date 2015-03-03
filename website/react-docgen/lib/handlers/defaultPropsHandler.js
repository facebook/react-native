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

var getPropertyName = require('../utils/getPropertyName');
var getPropertyValuePath = require('../utils/getPropertyValuePath');
var recast = require('recast');
var resolveToValue = require('../utils/resolveToValue');
var types = recast.types.namedTypes;
var visit = recast.types.visit;

function getDefaultValue(path) {
  var node = path.node;
  var defaultValue;
  if (types.Literal.check(node)) {
    defaultValue = node.raw;
  } else {
    path = resolveToValue(path);
    node = path.node;
    defaultValue = recast.print(path).code;
  }
  if (typeof defaultValue !== 'undefined') {
    return {
      value: defaultValue,
      computed: types.CallExpression.check(node) ||
                types.MemberExpression.check(node) ||
                types.Identifier.check(node)
    };
  }
}

function defaultPropsHandler(documentation: Documentation, path: NodePath) {
  var getDefaultPropsPath = getPropertyValuePath(path, 'getDefaultProps');
  if (!getDefaultPropsPath ||
      !types.FunctionExpression.check(getDefaultPropsPath.node)) {
    return;
  }

  // Find the value that is returned from the function and process it if it is
  // an object literal.
  var objectExpressionPath;
  visit(getDefaultPropsPath.get('body'), {
    visitFunction: () => false,
    visitReturnStatement: function(path) {
      var resolvedPath = resolveToValue(path.get('argument'));
      if (types.ObjectExpression.check(resolvedPath.node)) {
        objectExpressionPath = resolvedPath;
      }
      return false;
    }
  });

  if (objectExpressionPath) {
    objectExpressionPath.get('properties').each(function(propertyPath) {
      var propDescriptor = documentation.getPropDescriptor(
        getPropertyName(propertyPath)
      );
      var defaultValue = getDefaultValue(propertyPath.get('value'));
      if (defaultValue) {
        propDescriptor.defaultValue = defaultValue;
      }
    });
  }
}

module.exports = defaultPropsHandler;
