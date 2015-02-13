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

var types = require('recast').types.namedTypes;
var getDocblock = require('../utils/docblock').getDocblock;
var getPropertyName = require('../utils/getPropertyName');

function propDocBlockHandler(documentation: Documentation, path: NodePath) {
  if (!types.ObjectExpression.check(path.node)) {
    return;
  }

  path.get('properties').each(function(propertyPath) {
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
