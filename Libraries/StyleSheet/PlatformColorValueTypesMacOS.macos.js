/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */
// [TODO(macOS ISS#2323203)
'use strict';

import type {ColorValue} from './StyleSheetTypes';
import {
  DynamicColorMacOSPrivate,
  ColorWithSystemEffectMacOSPrivate,
} from './PlatformColorValueTypes';

export type DynamicColorMacOSTuple = {
  light: ColorValue,
  dark: ColorValue,
};

export const DynamicColorMacOS = (
  tuple: DynamicColorMacOSTuple,
): ColorValue => {
  return DynamicColorMacOSPrivate({light: tuple.light, dark: tuple.dark});
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
  return ColorWithSystemEffectMacOSPrivate(color, effect);
};
// ]TODO(macOS ISS#2323203)
