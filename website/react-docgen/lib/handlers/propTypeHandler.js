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

var getMembers = require('../utils/getMembers');
var getNameOrValue = require('../utils/getNameOrValue');
var getPropType = require('../utils/getPropType');
var getPropertyName = require('../utils/getPropertyName');
var getPropertyValuePath = require('../utils/getPropertyValuePath');
var isReactModuleName = require('../utils/isReactModuleName');
var recast = require('recast');
var resolveToModule = require('../utils/resolveToModule');
var resolveToValue = require('../utils/resolveToValue');
var types = recast.types.namedTypes;

function isPropTypesExpression(path) {
  var moduleName = resolveToModule(path);
  if (moduleName) {
    return isReactModuleName(moduleName) || moduleName === 'ReactPropTypes';
  }
  return false;
}

/**
 * Returns true of the prop is required, according to its type defintion
 */
function isRequired(path) {
  return getMembers(path).some(
    member => !member.computed && member.path.node.name === 'isRequired' ||
      member.computed && member.path.node.value === 'isRequired'
  );
}

/**
 * Handles member expressions of the form
 *
 *  ComponentA.propTypes
 *
 * it resolves ComponentA to its module name and adds it to the "composes" entry
 * in the documentation.
 */
function amendComposes(documentation, path) {
  var node = path.node;
  if (!types.MemberExpression.check(node) ||
      getNameOrValue(path.get('property')) !== 'propTypes' ||
      !types.Identifier.check(node.object)) {
    return;
  }

  var moduleName = resolveToModule(path.get('object'));
  if (moduleName) {
    documentation.addComposes(moduleName);
  }
}

function amendPropTypes(documentation, path) {
  path.get('properties').each(function(propertyPath) {
    switch (propertyPath.node.type) {
      case types.Property.name:
        var propDescriptor = documentation.getPropDescriptor(
          getPropertyName(propertyPath)
        );
        var valuePath = propertyPath.get('value');
        var type = isPropTypesExpression(valuePath) ?
          getPropType(valuePath) :
          {name: 'custom', raw: recast.print(valuePath).code};

        if (type) {
          propDescriptor.type = type;
          propDescriptor.required =
            type.name !== 'custom' && isRequired(valuePath);
        }
        break;
      case types.SpreadProperty.name:
        var resolvedValuePath = resolveToValue(propertyPath.get('argument'));
        switch (resolvedValuePath.node.type) {
          case types.ObjectExpression.name: // normal object literal
            amendPropTypes(documentation, resolvedValuePath);
            break;
          case types.MemberExpression.name:
            amendComposes(documentation, resolvedValuePath);
          break;
        }
        break;
    }
  });
}

function propTypeHandler(documentation: Documentation, path: NodePath) {
  var propTypesPath = getPropertyValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath || !types.ObjectExpression.check(propTypesPath.node)) {
    return;
  }

  switch (propTypesPath.node.type) {
    case types.ObjectExpression.name:
      amendPropTypes(documentation, propTypesPath);
      break;
    case types.MemberExpression.name:
      amendComposes(documentation, propTypesPath);
  }
}

module.exports = propTypeHandler;
