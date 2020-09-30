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

const UIManager = require('../ReactNative/UIManager');

/**
 * Adds a deprecation warning when the prop is used.
 */
function deprecatedPropType(
  propType: ReactPropsCheckType,
  explanation: string,
): ReactPropsCheckType {
  return function validate(props, propName, componentName, ...rest) {
    // Don't warn for native components.
    if (
      !global.RN$Bridgeless &&
      !UIManager.getViewManagerConfig(componentName) &&
      props[propName] !== undefined
    ) {
      console.warn(
        `\`${propName}\` supplied to \`${componentName}\` has been deprecated. ${explanation}`,
      );
    }

    return propType(props, propName, componentName, ...rest);
  };
}

module.exports = deprecatedPropType;
