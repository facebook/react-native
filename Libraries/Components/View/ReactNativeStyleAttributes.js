/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeStyleAttributes
 * @flow
 */

'use strict';

var ImageStylePropTypes = require('ImageStylePropTypes');
var Platform = require('Platform');
var TextStylePropTypes = require('TextStylePropTypes');
var ViewStylePropTypes = require('ViewStylePropTypes');

var keyMirror = require('keyMirror');
var matricesDiffer = require('matricesDiffer');
var processColor = require('processColor');
var processTransform = require('processTransform');
var sizesDiffer = require('sizesDiffer');

var ReactNativeStyleAttributes = {
  ...keyMirror(ViewStylePropTypes),
  ...keyMirror(TextStylePropTypes),
  ...keyMirror(ImageStylePropTypes),
};

ReactNativeStyleAttributes.transform = { process: processTransform };
ReactNativeStyleAttributes.transformMatrix = { diff: matricesDiffer };
ReactNativeStyleAttributes.shadowOffset = { diff: sizesDiffer };

// Do not rely on this attribute.
ReactNativeStyleAttributes.decomposedMatrix = 'decomposedMatrix';

var colorAttributes = { process: processColor };
ReactNativeStyleAttributes.backgroundColor = colorAttributes;
ReactNativeStyleAttributes.borderBottomColor = colorAttributes;
ReactNativeStyleAttributes.borderColor = colorAttributes;
ReactNativeStyleAttributes.borderLeftColor = colorAttributes;
ReactNativeStyleAttributes.borderRightColor = colorAttributes;
ReactNativeStyleAttributes.borderTopColor = colorAttributes;
ReactNativeStyleAttributes.color = colorAttributes;
ReactNativeStyleAttributes.shadowColor = colorAttributes;
ReactNativeStyleAttributes.textDecorationColor = colorAttributes;
ReactNativeStyleAttributes.tintColor = colorAttributes;
ReactNativeStyleAttributes.textShadowColor = colorAttributes;
ReactNativeStyleAttributes.overlayColor = colorAttributes;

if (Platform.OS === 'android') {
  // ReactAndroid doesn't currently have the capability to have variable typing
  // (eg. string or array) of a native attribute.  To work around that, we can
  // transform variable types into one standard type, as done here with
  // textDecorationLine which can be an array of enum values or a space-separated
  // string containing the same values.
  var processTextDecorationLine = require('processTextDecorationLine');
  ReactNativeStyleAttributes.textDecorationLine = {
    process: processTextDecorationLine
  };
}

module.exports = ReactNativeStyleAttributes;
