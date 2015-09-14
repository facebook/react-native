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
var TransformPropTypes = require('TransformPropTypes');

var ImageStylePropTypes = {
  ...LayoutPropTypes,
  ...TransformPropTypes,
  resizeMode: ReactPropTypes.oneOf(Object.keys(ImageResizeMode)),
  backgroundColor: ReactPropTypes.string,
  borderColor: ReactPropTypes.string,
  borderWidth: ReactPropTypes.number,
  borderRadius: ReactPropTypes.number,
  overflow: ReactPropTypes.oneOf(['visible', 'hidden']),

  // iOS-Specific style to "tint" an image.
  // It changes the color of all the non-transparent pixels to the tintColor
  tintColor: ReactPropTypes.string,
  opacity: ReactPropTypes.number,
};

module.exports = ImageStylePropTypes;
