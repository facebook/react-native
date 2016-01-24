 /**
  * Copyright (c) 2015-present, Facebook, Inc.
  * All rights reserved.
  *
  * This source code is licensed under the BSD-style license found in the
  * LICENSE file in the root directory of this source tree. An additional grant
  * of patent rights can be found in the PATENTS file in the same directory.
  *
  * @providesModule ColorPropType
  */
'use strict';

var ReactPropTypes = require('ReactPropTypes');

var normalizeColor = require('normalizeColor');

var ColorPropType = function(props, propName) {
  var selectedColor = props[propName];
  if (selectedColor === undefined) {
    return;
  }

  if (typeof selectedColor === 'number') {
    // Developers should not use a number, but we are using the prop type
    // both for user provided colors and for transformed ones. This isn't ideal
    // and should be fixed but will do for now...
    return;
  }

  if (normalizeColor(selectedColor) === null) {
    return new Error(
`Invalid color supplied to ${propName}: ${selectedColor}. Valid color formats are
  - #f0f (#rgb)
  - #f0fc (#rgba)
  - #ff00ff (#rrggbb)
  - #ff00ff00 (#rrggbbaa)
  - rgb(255, 255, 255)
  - rgba(255, 255, 255, 1.0)
  - hsl(360, 100%, 100%)
  - hsla(360, 100%, 100%, 1.0)
  - transparent
  - red`);
  }
};

module.exports = ColorPropType;
