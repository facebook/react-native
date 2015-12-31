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
var tinycolor = require('tinycolor');

var colorValidator = function (props, propName) {
  var selectedColor = props[propName];
  if (selectedColor === null || selectedColor === undefined || selectedColor.toString().trim() === '') {
    return new Error(
      `Invalid argument supplied to ${propName}.Expected a string like #123ADF or 'red'.`
    );
  }

  if (tinycolor(selectedColor.toString().trim()).isValid()) {
    return null;
  }

  return new Error(
    `Invalid argument supplied to ${propName}.Expected a string like #123ADF or 'red'.`
  );
};

var ColorPropType = ReactPropTypes.oneOfType([colorValidator, ReactPropTypes.number]);

module.exports = ColorPropType;
