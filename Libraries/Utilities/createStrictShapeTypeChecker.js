/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule createStrictShapeTypeChecker
 */
'use strict';

var ReactPropTypeLocationNames = require('ReactPropTypeLocationNames');

var invariant = require('invariant');
var merge = require('merge');

function createStrictShapeTypeChecker(shapeTypes) {
  function checkType(isRequired, props, propName, componentName, location) {
    if (!props[propName]) {
      if (isRequired) {
        invariant(
          false,
          `Required object \`${propName}\` was not specified in `+
          `\`${componentName}\`.`
        );
      }
      return;
    }
    var propValue = props[propName];
    var propType = typeof propValue;
    var locationName = ReactPropTypeLocationNames[location];
    if (propType !== 'object') {
      invariant(
        false,
        `Invalid ${locationName} \`${propName}\` of type \`${propType}\` ` +
          `supplied to \`${componentName}\`, expected \`object\`.`
      );
    }
    // We need to check all keys in case some are required but missing from
    // props.
    var allKeys = merge(props[propName], shapeTypes);
    for (var key in allKeys) {
      var checker = shapeTypes[key];
      if (!checker) {
        invariant(
          false,
          `Invalid props.${propName} key \`${key}\` supplied to \`${componentName}\`.` +
            `\nBad object: ` + JSON.stringify(props[propName], null, '  ') +
            `\nValid keys: ` + JSON.stringify(Object.keys(shapeTypes), null, '  ')
        );
      }
      var error = checker(propValue, key, componentName, location);
      if (error) {
        invariant(
          false,
          error.message +
            `\nBad object: ` + JSON.stringify(props[propName], null, '  ')
        );
        return error;
      }
    }
  }
  var chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);
  return chainedCheckType;
}

module.exports = createStrictShapeTypeChecker;
