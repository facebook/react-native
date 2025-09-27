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

import type AnimatedNode from '../Animated/nodes/AnimatedNode';
import type {
  ____DangerouslyImpreciseAnimatedStyleProp_Internal,
  ____FlattenStyleProp_Internal,
} from './StyleSheetTypes';

type NonAnimatedNodeObject<TStyleProp> = TStyleProp extends AnimatedNode
  ? empty
  : TStyleProp;

function flattenStyle<
  TStyleProp: ____DangerouslyImpreciseAnimatedStyleProp_Internal,
>(
  style: ?TStyleProp,
  // $FlowFixMe[underconstrained-implicit-instantiation]
): ?NonAnimatedNodeObject<____FlattenStyleProp_Internal<TStyleProp>> {
  if (style === null || typeof style !== 'object') {
    return undefined;
  }

  if (!Array.isArray(style)) {
    // $FlowFixMe[incompatible-type]
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
        // $FlowFixMe[invalid-computed-prop]
        // $FlowFixMe[prop-missing]
        result[key] = computedStyle[key];
      }
    }
  }
  // $FlowFixMe[incompatible-type]
  return result;
}

export default flattenStyle;
