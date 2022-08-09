/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {DangerouslyImpreciseStyleProp} from './StyleSheet';
import type {____FlattenStyleProp_Internal} from './StyleSheetTypes';

function flattenStyle<+TStyleProp: DangerouslyImpreciseStyleProp>(
  style: ?TStyleProp,
): ?____FlattenStyleProp_Internal<TStyleProp> {
  if (style === null || typeof style !== 'object') {
    return undefined;
  }

  if (!Array.isArray(style)) {
    return style;
  }

  const result = {};
  for (let i = 0, styleLength = style.length; i < styleLength; ++i) {
    const computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      for (const key in computedStyle) {
        result[key] = computedStyle[key];
      }
    }
  }
  return result;
}

module.exports = flattenStyle;
