/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/* eslint no-bitwise: 0 */

'use strict';

const normalizeColor = require('../../StyleSheet/normalizeColor');

function colorToRgba(input: string): string {
  let int32Color = normalizeColor(input);
  if (int32Color === null) {
    return input;
  }

  int32Color = int32Color || 0;

  const r = (int32Color & 0xff000000) >>> 24;
  const g = (int32Color & 0x00ff0000) >>> 16;
  const b = (int32Color & 0x0000ff00) >>> 8;
  const a = (int32Color & 0x000000ff) / 255;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export {colorToRgba};
