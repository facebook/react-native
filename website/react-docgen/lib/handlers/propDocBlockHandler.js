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

var getDocblock = require('../utils/docblock').getDocblock;
var getPropertyName = require('../utils/getPropertyName');
var getPropertyValuePath = require('../utils/getPropertyValuePath');
var types = require('recast').types.namedTypes;
var resolveToValue = require('../utils/resolveToValue');

function propDocBlockHandler(documentation: Documentation, path: NodePath) {
  var propTypesPath = getPropertyValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath || !types.ObjectExpression.check(propTypesPath.node)) {
    return;
  }

  propTypesPath.get('properties').each(function(propertyPath) {
    // we only support documentation of actual properties, not spread
    if (types.Property.check(propertyPath.node)) {
      var propDescriptor = documentation.getPropDescriptor(
        getPropertyName(propertyPath)
      );
      propDescriptor.description = getDocblock(propertyPath) || '';
    }
  });
}

module.exports = propDocBlockHandler;
