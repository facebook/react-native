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

var getMembers = require('./getMembers');
var getPropertyName = require('./getPropertyName');
var recast = require('recast');
var resolveToValue = require('./resolveToValue');

var types = recast.types.namedTypes;

function getEnumValues(path) {
  return path.get('elements').map(function(elementPath) {
    return {
      value: recast.print(elementPath).code,
      computed: !types.Literal.check(elementPath.node)
    };
  });
}

function getPropTypeOneOf(argumentPath) {
  var type = {name: 'enum'};
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = recast.print(argumentPath).code;
  } else {
    type.value = getEnumValues(argumentPath);
  }
  return type;
}

function getPropTypeOneOfType(argumentPath) {
  var type = {name: 'union'};
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = recast.print(argumentPath).code;
  } else {
    type.value = argumentPath.get('elements').map(getPropType);
  }
  return type;
}

function getPropTypeArrayOf(argumentPath) {
  var type = {name: 'arrayOf'};
  var subType = getPropType(argumentPath);

  if (subType.name === 'unknown') {
    type.value = recast.print(argumentPath).code;
    type.computed = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeShape(argumentPath) {
  var type: {name: string; value: any;} = {name: 'shape', value: 'unkown'};
  if (!types.ObjectExpression.check(argumentPath.node)) {
    argumentPath = resolveToValue(argumentPath);
  }

  if (types.ObjectExpression.check(argumentPath.node)) {
    type.value = {};
    argumentPath.get('properties').each(function(propertyPath) {
      type.value[getPropertyName(propertyPath)] =
        getPropType(propertyPath.get('value'));
    });
  }

  return type;
}

function getPropTypeInstanceOf(argumentPath) {
  return {
    name: 'instanceOf',
    value: recast.print(argumentPath).code
  };
}

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

var propTypes = {
  oneOf: getPropTypeOneOf,
  oneOfType: getPropTypeOneOfType,
  instanceOf: getPropTypeInstanceOf,
  arrayOf: getPropTypeArrayOf,
  shape: getPropTypeShape
};

/**
 * Tries to identify the prop type by inspecting the path for known
 * prop type names. This method doesn't check whether the found type is actually
 * from React.PropTypes. It simply assumes that a match has the same meaning
 * as the React.PropTypes one.
 *
 * If there is no match, "custom" is returned.
 */
function getPropType(path: NodePath): PropTypeDescriptor {
  var node = path.node;
  var descriptor;
  getMembers(path).some(member => {
    var node = member.path.node;
    var name;
    if (types.Literal.check(node)) {
      name = node.value;
    } else if (types.Identifier.check(node) && !member.computed) {
      name = node.name;
    }
    if (simplePropTypes.hasOwnProperty(name)) {
      descriptor = {name};
      return true;
    } else if (propTypes.hasOwnProperty(name) && member.argumentsPath) {
      descriptor = propTypes[name](member.argumentsPath.get(0));
      return true;
    }
  });
  if (!descriptor) {
    if (types.Identifier.check(node) &&
        simplePropTypes.hasOwnProperty(node.name)) {
      descriptor = {name: node.name};
    } else if (types.CallExpression.check(node) &&
        types.Identifier.check(node.callee) &&
        propTypes.hasOwnProperty(node.callee.name)) {
      descriptor = propTypes[node.callee.name](path.get('arguments', 0));
    } else {
      descriptor = {name: 'custom', raw: recast.print(path).code};
    }
  }
  return descriptor;
}

module.exports = getPropType;
