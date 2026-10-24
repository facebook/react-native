/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EdgeInsetsProp} from '../../../../Libraries/StyleSheet/EdgeInsetsPropType';
import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {SafeAreaInsets} from '../../../../Libraries/Types/CoreEventTypes';

import I18nManager from '../../../../Libraries/ReactNative/I18nManager';
import flattenStyle from '../../../../Libraries/StyleSheet/flattenStyle';

type PhysicalEdge = 'top' | 'right' | 'bottom' | 'left';

/**
 * The padding a style resolves to on one physical edge, following Yoga's
 * precedence: the logical edge (start or end), then the physical edge, then
 * the axis, then `padding`. Values that are not plain numbers resolve to 0.
 */
function resolvePadding(
  style: ?{readonly [key: string]: unknown, ...},
  edge: PhysicalEdge,
  isRTL: boolean,
): number {
  if (style == null) {
    return 0;
  }
  const keys: Array<string> = [];
  if (edge === 'left' || edge === 'right') {
    const {doLeftAndRightSwapInRTL} = I18nManager.getConstants();
    const swap = isRTL && doLeftAndRightSwapInRTL;
    const leading = (edge === 'left') !== isRTL;
    keys.push(leading ? 'paddingStart' : 'paddingEnd');
    let physical = edge;
    if (swap) {
      physical = edge === 'left' ? 'right' : 'left';
    }
    keys.push(physical === 'left' ? 'paddingLeft' : 'paddingRight');
    keys.push('paddingHorizontal');
  } else {
    keys.push(edge === 'top' ? 'paddingTop' : 'paddingBottom');
    keys.push('paddingVertical');
  }
  keys.push('padding');
  for (const key of keys) {
    const value = style[key];
    if (value != null) {
      return typeof value === 'number' ? value : 0;
    }
  }
  return 0;
}

/**
 * Padding that keeps a scroll view's content container clear of the safe area
 * on the axis the scroll view does not scroll along, on top of the padding its
 * style already has. Logical edges are used across the row, since they take
 * precedence over every other padding key on that edge.
 */
export default function getSafeAreaContentPadding(
  contentContainerStyle: ViewStyleProp,
  insets: SafeAreaInsets,
  horizontal: boolean,
): ViewStyleProp {
  const style: ?{readonly [key: string]: unknown, ...} = flattenStyle(
    contentContainerStyle,
  );
  if (horizontal) {
    return {
      paddingTop: resolvePadding(style, 'top', false) + insets.top,
      paddingBottom: resolvePadding(style, 'bottom', false) + insets.bottom,
    };
  }
  const isRTL = I18nManager.getConstants().isRTL;
  const left = resolvePadding(style, 'left', isRTL) + insets.left;
  const right = resolvePadding(style, 'right', isRTL) + insets.right;
  return {
    paddingStart: isRTL ? right : left,
    paddingEnd: isRTL ? left : right,
  };
}

/**
 * The `contentInset` for a scroll view whose content container is padded by
 * the safe area across the scrollable axis while UIKit also applies the safe
 * area on that axis as a content inset, as `'always'` does. Subtracting the
 * insets there leaves the adjusted content inset at the caller's own
 * `contentInset` across the scrollable axis, so the safe area applies once.
 */
export function getSafeAreaContentInset(
  contentInset: ?EdgeInsetsProp,
  insets: SafeAreaInsets,
  horizontal: boolean,
): EdgeInsetsProp {
  if (horizontal) {
    return {
      ...contentInset,
      top: (contentInset?.top ?? 0) - insets.top,
      bottom: (contentInset?.bottom ?? 0) - insets.bottom,
    };
  }
  return {
    ...contentInset,
    left: (contentInset?.left ?? 0) - insets.left,
    right: (contentInset?.right ?? 0) - insets.right,
  };
}
