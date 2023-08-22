/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// [macOS]

'use strict';

import type {ColorValue} from './StyleSheet';

export type DynamicColorMacOSTuple = {
  light: ColorValue,
  dark: ColorValue,
  highContrastLight?: ColorValue,
  highContrastDark?: ColorValue,
};

export const DynamicColorMacOS = (
  tuple: DynamicColorMacOSTuple,
): ColorValue => {
  throw new Error('DynamicColorMacOS is not available on this platform.');
};

export type SystemEffectMacOS =
  | 'none'
  | 'pressed'
  | 'deepPressed'
  | 'disabled'
  | 'rollover';

export const ColorWithSystemEffectMacOS = (
  color: ColorValue,
  effect: SystemEffectMacOS,
): ColorValue => {
  throw new Error(
    'ColorWithSystemEffectMacOS is not available on this platform.',
  );
};
