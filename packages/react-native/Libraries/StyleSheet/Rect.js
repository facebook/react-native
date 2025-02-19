/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

export type Rect = $ReadOnly<{
  bottom?: ?number,
  left?: ?number,
  right?: ?number,
  top?: ?number,
}>;

export type RectOrSize = Rect | number;

export function createSquare(size: number): Rect {
  return {bottom: size, left: size, right: size, top: size};
}

export function normalizeRect(rectOrSize: ?RectOrSize): ?Rect {
  return typeof rectOrSize === 'number' ? createSquare(rectOrSize) : rectOrSize;
}
