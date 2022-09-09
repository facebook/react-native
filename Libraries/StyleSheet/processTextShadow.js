/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../StyleSheet/StyleSheet';

function processTextShadow(textShadow: string): {
  xOffset?: number,
  yOffset?: number,
  blurRadius?: number,
  color?: ColorValue,
} {
  const regex = new RegExp(
    /^(?:((?:-?(?:\d+(?:\.?\d*)))(?:(?:\s*-?(?:\d+(?:\.?\d*))){0,2}))?(?:\s*((?:[^\s](?:\s*\d\s*)?)*)))$/gim,
  );

  const match = regex.exec(textShadow.trim());

  // Can be replaced with named groups when supported.
  // First Capturing Group
  const numberStr = match?.[1];

  // Second Capturing Group
  const color = match?.[2];

  const [xOffset, yOffset, blurRadius] =
    numberStr?.split(' ').map(number => Number(number)) || [];
  return {xOffset, yOffset, blurRadius, color};
}

module.exports = processTextShadow;
