/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule validAttributesFromPropTypes
 */
'use strict'

function validAttributesFromPropTypes(propTypes) {
  var validAttributes = {};
  for (var key in propTypes) {
    var propType = propTypes[key];
    if (propType && propType.isNative) {
      var diff = propType.differ;
      validAttributes[key] = diff ? {diff} : true;
    }
  }
  return validAttributes;
}

module.exports = validAttributesFromPropTypes;
