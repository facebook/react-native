/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ImageStylePropTypes
 * @flow
 */
'use strict';

var ImageResizeMode = require('ImageResizeMode');
var LayoutPropTypes = require('LayoutPropTypes');
var ReactPropTypes = require('ReactPropTypes');
var ColorPropType = require('ColorPropType');
var ShadowPropTypesIOS = require('ShadowPropTypesIOS');
var TransformPropTypes = require('TransformPropTypes');

var ImageStylePropTypes = {
  ...LayoutPropTypes,
  ...ShadowPropTypesIOS,
  ...TransformPropTypes,
  resizeMode: ReactPropTypes.oneOf(Object.keys(ImageResizeMode)),
  backfaceVisibility: ReactPropTypes.oneOf(['visible', 'hidden']),
  backgroundColor: ColorPropType,
  borderColor: ColorPropType,
  borderWidth: ReactPropTypes.number,
  borderRadius: ReactPropTypes.number,
  overflow: ReactPropTypes.oneOf(['visible', 'hidden']),

  // iOS-Specific style to "tint" an image.
  // It changes the color of all the non-transparent pixels to the tintColor
  tintColor: ColorPropType,
  opacity: ReactPropTypes.number,
  
  /**
  * Android-Specific style to allow rounded corners based on a solid color.
  * Specifying an overlayColor will cause Fresco to switch to its other rounding 
  * corners rendering mode, OVERLAY_COLOR, and will draw rounded corners (configured using borderRadius) 
  * by overlaying the solid color specified.
  * a null or transparent overlayColor will default back to BITMAP_ONLY.
  */  
  overlayColor: ReactPropTypes.string,
};

module.exports = ImageStylePropTypes;
