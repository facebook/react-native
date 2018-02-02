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

var invariant = require('fbjs/lib/invariant');
var ReactNativePropRegistry;

import type { StyleObj } from 'StyleSheetTypes';

function getStyle(style) {
  if (ReactNativePropRegistry === undefined) {
    ReactNativePropRegistry = require('ReactNativePropRegistry');
  }
  if (typeof style === 'number') {
    return ReactNativePropRegistry.getByID(style);
  }
  return style;
}

function flattenStyle(style: ?StyleObj): ?Object {
  if (!style) {
    return undefined;
  }
  invariant(style !== true, 'style may be false but not true');

  if (!Array.isArray(style)) {
    /* $FlowFixMe(>=0.63.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.63 was deployed. To see the error delete this
     * comment and run Flow. */
    return getStyle(style);
  }

  var result = {};
  for (var i = 0, styleLength = style.length; i < styleLength; ++i) {
    var computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      for (var key in computedStyle) {
        result[key] = computedStyle[key];
      }
    }
  }
  return result;
}

module.exports = flattenStyle;
