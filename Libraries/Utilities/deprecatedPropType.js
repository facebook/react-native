/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule deprecatedPropType
 * @flow
 */
'use strict';

const UIManager = require('UIManager');

/**
 * Adds a deprecation warning when the prop is used.
 */
function deprecatedPropType(
  propType: ReactPropsCheckType,
  explanation: string
): ReactPropsCheckType {
  return function validate(props, propName, componentName) {
    // Don't warn for native components.
    if (!UIManager[componentName] && props[propName] !== undefined) {
      console.warn(`\`${propName}\` supplied to \`${componentName}\` has been deprecated. ${explanation}`);
    }

    return propType(props, propName, componentName);
  };
}

module.exports = deprecatedPropType;
