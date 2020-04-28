/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow
 */

'use strict';

const DeprecatedImageStylePropTypes = require('../../DeprecatedPropTypes/DeprecatedImageStylePropTypes');
const DeprecatedTextStylePropTypes = require('../../DeprecatedPropTypes/DeprecatedTextStylePropTypes');
const DeprecatedViewStylePropTypes = require('../../DeprecatedPropTypes/DeprecatedViewStylePropTypes');

const processColor = require('../../StyleSheet/processColor');
const processTransform = require('../../StyleSheet/processTransform');
const sizesDiffer = require('../../Utilities/differ/sizesDiffer');

const ReactNativeStyleAttributes = {};

for (const attributeName of Object.keys({
  ...DeprecatedViewStylePropTypes,
  ...DeprecatedTextStylePropTypes,
  ...DeprecatedImageStylePropTypes,
})) {
  ReactNativeStyleAttributes[attributeName] = true;
}

ReactNativeStyleAttributes.transform = {process: processTransform};
ReactNativeStyleAttributes.shadowOffset = {diff: sizesDiffer};

const colorAttributes = {process: processColor};
ReactNativeStyleAttributes.backgroundColor = colorAttributes;
ReactNativeStyleAttributes.borderBottomColor = colorAttributes;
ReactNativeStyleAttributes.borderColor = colorAttributes;
ReactNativeStyleAttributes.borderLeftColor = colorAttributes;
ReactNativeStyleAttributes.borderRightColor = colorAttributes;
ReactNativeStyleAttributes.borderTopColor = colorAttributes;
ReactNativeStyleAttributes.borderStartColor = colorAttributes;
ReactNativeStyleAttributes.borderEndColor = colorAttributes;
ReactNativeStyleAttributes.color = colorAttributes;
ReactNativeStyleAttributes.shadowColor = colorAttributes;
ReactNativeStyleAttributes.textDecorationColor = colorAttributes;
ReactNativeStyleAttributes.tintColor = colorAttributes;
ReactNativeStyleAttributes.textShadowColor = colorAttributes;
ReactNativeStyleAttributes.overlayColor = colorAttributes;

module.exports = ReactNativeStyleAttributes;
