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

// $FlowFixMe[unsupported-variance-annotation]
function flattenStyle<+TStyleProp: DangerouslyImpreciseStyleProp>(
  style: ?TStyleProp,
  // $FlowFixMe[underconstrained-implicit-instantiation]
): ?____FlattenStyleProp_Internal<TStyleProp> {
  if (style === null || typeof style !== 'object') {
    return undefined;
  }

  if (!Array.isArray(style)) {
    return style;
  }

  const result: {[string]: $FlowFixMe} = {};
  for (let i = 0, styleLength = style.length; i < styleLength; ++i) {
    // $FlowFixMe[underconstrained-implicit-instantiation]
    const computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      // $FlowFixMe[invalid-in-rhs]
      for (const key in computedStyle) {
        // $FlowFixMe[incompatible-use]
        result[key] = computedStyle[key];
      }
    }
  }
  // $FlowFixMe[incompatible-return]
  return result;
}

module.exports = flattenStyle;
