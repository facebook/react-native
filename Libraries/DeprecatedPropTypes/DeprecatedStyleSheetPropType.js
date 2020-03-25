/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const deprecatedCreateStrictShapeTypeChecker = require('./deprecatedCreateStrictShapeTypeChecker');
const flattenStyle = require('../StyleSheet/flattenStyle');

function DeprecatedStyleSheetPropType(shape: {
  [key: string]: ReactPropsCheckType,
  ...,
}): ReactPropsCheckType {
  const shapePropType = deprecatedCreateStrictShapeTypeChecker(shape);
  return function(props, propName, componentName, location?, ...rest) {
    let newProps = props;
    if (props[propName]) {
      // Just make a dummy prop object with only the flattened style
      newProps = {};
      newProps[propName] = flattenStyle(props[propName]);
    }
    return shapePropType(newProps, propName, componentName, location, ...rest);
  };
}

module.exports = DeprecatedStyleSheetPropType;
