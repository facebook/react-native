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

var expressionTo = require('../utils/expressionTo');
var getNameOrValue = require('../utils/getNameOrValue');
var getPropertyName = require('../utils/getPropertyName');
var isReactModuleName = require('../utils/isReactModuleName');
var recast = require('recast');
var resolveToModule = require('../utils/resolveToModule');
var resolveToValue = require('../utils/resolveToValue');
var types = recast.types.namedTypes;

var simplePropTypes = {
  array: 1,
  bool: 1,
  func: 1,
  number: 1,
  object: 1,
  string: 1,
  any: 1,
  element: 1,
  node: 1
};

function isPropTypesExpression(path) {
  var moduleName = resolveToModule(path);
  if (moduleName) {
    return isReactModuleName(moduleName) || moduleName === 'ReactPropTypes';
  }
  return false;
}

function getEnumValues(path) {
  return path.get('elements').map(function(elementPath) {
    return {
      value: expressionTo.String(elementPath),
      computed: !types.Literal.check(elementPath.node)
    };
  });
}

function getPropTypeOneOf(path) {
  types.CallExpression.assert(path.node);

  var argumentPath = path.get('arguments', 0);
  var type = {name: 'enum'};
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = expressionTo.String(argumentPath);
  } else {
    type.value = getEnumValues(argumentPath);
  }
  return type;
}

function getPropTypeOneOfType(path) {
  types.CallExpression.assert(path.node);

  var argumentPath = path.get('arguments', 0);
  var type = {name: 'union'};
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = expressionTo.String(argumentPath);
  } else {
    type.value = argumentPath.get('elements').map(getPropType);
  }
  return type;
}

function getPropTypeArrayOf(path) {
  types.CallExpression.assert(path.node);

  var argumentPath = path.get('arguments', 0);
  var type = {name: 'arrayof'};
  var subType = getPropType(argumentPath);

  if (subType.name === 'unknown') {
    type.value = expressionTo.String(argumentPath);
    type.computed = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeShape(path) {
  types.CallExpression.assert(path.node);

  var valuePath = path.get('arguments', 0);
  var type: {name: string; value: any;} = {name: 'shape', value: 'unkown'};
  if (!types.ObjectExpression.check(valuePath.node)) {
    valuePath = resolveToValue(valuePath);
  }

  if (types.ObjectExpression.check(valuePath.node)) {
    type.value = {};
    valuePath.get('properties').each(function(propertyPath) {
      type.value[getPropertyName(propertyPath)] =
        getPropType(propertyPath.get('value'));
    });
  }

  return type;
}

function getPropTypeInstanceOf(path) {
  types.CallExpression.assert(path.node);

  return {
    name: 'instance',
    value: expressionTo.String(path.get('arguments', 0))
  };
}

var propTypes = {
  oneOf: getPropTypeOneOf,
  oneOfType: getPropTypeOneOfType,
  instanceOf: getPropTypeInstanceOf,
  arrayOf: getPropTypeArrayOf,
  shape: getPropTypeShape
};

/**
 * Tries to identify the prop type by the following rules:
 *
 * Member expressions which resolve to the `React` or `ReactPropTypes` module
 * are inspected to see whether their properties are prop types. Strictly
 * speaking we'd have to test whether the Member expression resolves to
 * require('React').PropTypes, but we are not doing this right now for
 * simplicity.
 *
 * Everything else is treated as custom validator
 */
function getPropType(path) {
  var node = path.node;
  if (types.Function.check(node) || !isPropTypesExpression(path)) {
    return {
      name: 'custom',
      raw: recast.print(path).code
    };
  }

  var expressionParts = [];

  if (types.MemberExpression.check(node)) {
    // React.PropTypes.something.isRequired
    if (isRequired(path)) {
      path = path.get('object');
      node = path.node;
    }
    // React.PropTypes.something
    expressionParts = expressionTo.Array(path);
  }
  if (types.CallExpression.check(node)) {
    // React.PropTypes.something()
    expressionParts = expressionTo.Array(path.get('callee'));
  }

  // React.PropTypes.something -> something
  var propType = expressionParts.pop();
  var type;
  if (propType in propTypes) {
    type = propTypes[propType](path);
  } else  {
    type = {name: (propType in simplePropTypes) ? propType : 'unknown'};
  }
  return type;
}

/**
 * Returns true of the prop is required, according to its type defintion
 */
function isRequired(path) {
  if (types.MemberExpression.check(path.node)) {
    var expressionParts = expressionTo.Array(path);
    if (expressionParts[expressionParts.length - 1] === 'isRequired') {
      return true;
    }
  }
  return false;
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
        var type = getPropType(propertyPath.get('value'));
        if (type) {
          var propDescriptor = documentation.getPropDescriptor(
            getPropertyName(propertyPath)
          );
          propDescriptor.type = type;
          propDescriptor.required = type.name !== 'custom' &&
            isRequired(propertyPath.get('value'));
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
  path = resolveToValue(path);
  switch (path.node.type) {
    case types.ObjectExpression.name:
      amendPropTypes(documentation, path);
      break;
    case types.MemberExpression.name:
      amendComposes(documentation, path);
  }
}

module.exports = propTypeHandler;
