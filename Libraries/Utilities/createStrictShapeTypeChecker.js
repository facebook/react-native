/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createStrictShapeTypeChecker
 * @flow
 */
'use strict';

var ReactPropTypeLocationNames = require('ReactPropTypeLocationNames');

var invariant = require('fbjs/lib/invariant');
var merge = require('merge');

function createStrictShapeTypeChecker(
  shapeTypes: {[key: string]: ReactPropsCheckType}
): ReactPropsChainableTypeChecker {
  function checkType(isRequired, props, propName, componentName, location?) {
    if (!props[propName]) {
      if (isRequired) {
        invariant(
          false,
          `Required object \`${propName}\` was not specified in ` +
          `\`${componentName}\`.`
        );
      }
      return;
    }
    var propValue = props[propName];
    var propType = typeof propValue;
    var locationName =
      location && ReactPropTypeLocationNames[location] || '(unknown)';
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
      }
    }
  }
  function chainedCheckType(
    props: {[key: string]: any},
    propName: string,
    componentName: string,
    location?: string
  ): ?Error {
    return checkType(false, props, propName, componentName, location);
  }
  chainedCheckType.isRequired = checkType.bind(null, true);
  return chainedCheckType;
}

module.exports = createStrictShapeTypeChecker;
