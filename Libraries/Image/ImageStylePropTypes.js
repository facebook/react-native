/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ImageStylePropTypes
 */
'use strict';

var ImageResizeMode = require('ImageResizeMode');
var LayoutPropTypes = require('LayoutPropTypes');
var ReactPropTypes = require('ReactPropTypes');

var merge = require('merge');

var ImageStylePropTypes = merge(
  LayoutPropTypes,
  {
    resizeMode: ReactPropTypes.oneOf(Object.keys(ImageResizeMode)),
    backgroundColor: ReactPropTypes.string,
    borderColor: ReactPropTypes.string,
    borderWidth: ReactPropTypes.number,
    borderRadius: ReactPropTypes.number,

    // iOS-Specific style to "tint" an image.
    // It changes the color of all the non-transparent pixels to the tintColor
    tintColor: ReactPropTypes.string,
    opacity: ReactPropTypes.number,
  }
);

// Image doesn't support padding correctly (#4841912)
var unsupportedProps = Object.keys({
  padding: null,
  paddingTop: null,
  paddingLeft: null,
  paddingRight: null,
  paddingBottom: null,
  paddingVertical: null,
  paddingHorizontal: null,
});

for (var key in unsupportedProps) {
  delete ImageStylePropTypes[key];
}

module.exports = ImageStylePropTypes;
