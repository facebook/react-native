/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

/* eslint no-bitwise: 0 */

import type {ProcessedColorValue} from './processColor';
import type {ColorValue} from './StyleSheet';

import _normalizeColor from '@react-native/normalize-colors';

function normalizeColor(
  color: ?(ColorValue | ProcessedColorValue),
): ?ProcessedColorValue {
  if (typeof color === 'object' && color != null) {
    const {normalizeColorObject} = require('./PlatformColorValueTypes');
    const normalizedColor = normalizeColorObject(color);
    if (normalizedColor != null) {
      return normalizedColor;
    }
  }

  if (typeof color === 'string' || typeof color === 'number') {
    return _normalizeColor(color);
  }
}

export default normalizeColor;
