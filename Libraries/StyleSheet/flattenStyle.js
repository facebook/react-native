/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule flattenStyle
 */
'use strict';

var StyleSheetRegistry = require('StyleSheetRegistry');
var mergeIntoFast = require('mergeIntoFast');

function getStyle(style) {
  if (typeof style === 'number') {
    return StyleSheetRegistry.getStyleByID(style);
  }
  return style;
}

function flattenStyle(style) {
  if (!style) {
    return undefined;
  }

  if (!Array.isArray(style)) {
    return getStyle(style);
  }

  var result = {};
  for (var i = 0; i < style.length; ++i) {
    var computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      mergeIntoFast(result, computedStyle);
    }
  }
  return result;
}

module.exports = flattenStyle;
