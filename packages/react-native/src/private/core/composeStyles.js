/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * Combines two styles such that `style2` will override any styles in `style1`.
 * If either style is null or undefined, the other one is returned without
 * allocating an array, saving allocations and enabling memoization.
 */
export default function composeStyles<T1, T2>(
  style1: ?T1,
  style2: ?T2,
): ?(T1 | T2 | $ReadOnlyArray<T1 | T2>) {
  if (style1 == null) {
    return style2;
  }
  if (style2 == null) {
    return style1;
  }
  return [style1, style2];
}
