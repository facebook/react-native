/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MaskPropTypesIOS
 * @flow
 */
'use strict';

var ColorPropType = require('ColorPropType');
var ReactPropTypes = require('React').PropTypes;

var MaskPropTypesIOS = {
  /**
   * Sets the view's mask to a gradient created with the given colors and locations.
   * A gradient can be specified using an object with the following properties:
   *
   * - `colors` - An array of colors with alpha channel using the standard color syntax. Only the alpha channel is used for the mask. (required)
   * - `locations` - An array of percentages that correspond to each color in the `colors` array.
   * - `sideOrCorner` - The direction of the gradient.  It consists of two keywords: one indicates the horizontal side, "left" or "right", and the other the vertical side, "top" or "bottom". The order is not relevant and each is optional. If omitted, it defaults to "to bottom".
   *
   * More information on the syntax of `sideOrCorner` can be found in the documentation for [CSS `linear-gradient`](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient).
   *
   * @platform ios
   */
  mask: ReactPropTypes.shape({
    colors: ReactPropTypes.arrayOf(ColorPropType).isRequired,
    locations: ReactPropTypes.arrayOf(ReactPropTypes.number),
    sideOrCorner: ReactPropTypes.string,
  }),
};

module.exports = MaskPropTypesIOS;
