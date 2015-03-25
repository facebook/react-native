/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule flattenStyle
 * @flow
 */
'use strict';

var StyleSheetRegistry = require('StyleSheetRegistry');
var invariant = require('invariant');
var mergeIntoFast = require('mergeIntoFast');

type Atom = number | bool | Object | Array<?Atom>
type StyleObj = Atom | Array<?StyleObj>

function getStyle(style) {
  if (typeof style === 'number') {
    return StyleSheetRegistry.getStyleByID(style);
  }
  return style;
}

// TODO: Flow 0.7.0 doesn't refine bools properly so we have to use `any` to
// tell it that this can't be a bool anymore. Should be fixed in 0.8.0,
// after which this can take a ?StyleObj.
function flattenStyle(style: any): ?Object {
  if (!style) {
    return undefined;
  }
  invariant(style !== true, 'style may be false but not true');

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
