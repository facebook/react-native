/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ImageStylePropTypes = require('ImageStylePropTypes');
const TextStylePropTypes = require('TextStylePropTypes');
const ViewStylePropTypes = require('ViewStylePropTypes');

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const keyMirror = require('fbjs/lib/keyMirror');
const processColor = require('processColor');
const processTransform = require('processTransform');
const sizesDiffer = require('sizesDiffer');

const ReactNativeStyleAttributes = {
  ...keyMirror(ViewStylePropTypes),
  ...keyMirror(TextStylePropTypes),
  ...keyMirror(ImageStylePropTypes),
};

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
