/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const invariant = require('invariant');
const merge = require('merge');

function deprecatedCreateStrictShapeTypeChecker(shapeTypes: {
  [key: string]: ReactPropsCheckType,
}): ReactPropsChainableTypeChecker {
  function checkType(
    isRequired,
    props,
    propName,
    componentName,
    location?,
    ...rest
  ) {
    if (!props[propName]) {
      if (isRequired) {
        invariant(
          false,
          `Required object \`${propName}\` was not specified in ` +
            `\`${componentName}\`.`,
        );
      }
      return;
    }
    const propValue = props[propName];
    const propType = typeof propValue;
    const locationName = location || '(unknown)';
    if (propType !== 'object') {
      invariant(
        false,
        `Invalid ${locationName} \`${propName}\` of type \`${propType}\` ` +
          `supplied to \`${componentName}\`, expected \`object\`.`,
      );
    }
    // We need to check all keys in case some are required but missing from
    // props.
    const allKeys = merge(props[propName], shapeTypes);
    for (const key in allKeys) {
      const checker = shapeTypes[key];
      if (!checker) {
        invariant(
          false,
          `Invalid props.${propName} key \`${key}\` supplied to \`${componentName}\`.` +
            '\nBad object: ' +
            JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' +
            JSON.stringify(Object.keys(shapeTypes), null, '  '),
        );
      }
      const error = checker(propValue, key, componentName, location, ...rest);
      if (error) {
        invariant(
          false,
          error.message +
            '\nBad object: ' +
            JSON.stringify(props[propName], null, '  '),
        );
      }
    }
  }
  function chainedCheckType(
    props: {[key: string]: any},
    propName: string,
    componentName: string,
    location?: string,
    ...rest
  ): ?Error {
    return checkType(false, props, propName, componentName, location, ...rest);
  }
  chainedCheckType.isRequired = checkType.bind(null, true);
  return chainedCheckType;
}

module.exports = deprecatedCreateStrictShapeTypeChecker;
