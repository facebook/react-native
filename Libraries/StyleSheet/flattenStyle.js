/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule flattenStyle
 * @flow
 * @format
 */
'use strict';

var ReactNativePropRegistry;

import type {DangerouslyImpreciseStyleProp} from 'StyleSheet';
import type {DangerouslyImpreciseStyle} from 'StyleSheetTypes';

function getStyle(style) {
  if (ReactNativePropRegistry === undefined) {
    ReactNativePropRegistry = require('ReactNativePropRegistry');
  }
  if (typeof style === 'number') {
    return ReactNativePropRegistry.getByID(style);
  }
  return style;
}

function flattenStyle(
  style: ?DangerouslyImpreciseStyleProp,
): ?DangerouslyImpreciseStyle {
  if (style == null) {
    return undefined;
  }

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
