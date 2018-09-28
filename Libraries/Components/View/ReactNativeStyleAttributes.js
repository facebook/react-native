/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow
 */

'use strict';

const ImageStylePropTypes = require('ImageStylePropTypes');
const TextStylePropTypes = require('TextStylePropTypes');
const ViewStylePropTypes = require('ViewStylePropTypes');

const processColor = require('processColor');
const processTransform = require('processTransform');
const sizesDiffer = require('sizesDiffer');

const ReactNativeStyleAttributes = {};

for (const attributeName of Object.keys({
  ...ViewStylePropTypes,
  ...TextStylePropTypes,
  ...ImageStylePropTypes,
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
