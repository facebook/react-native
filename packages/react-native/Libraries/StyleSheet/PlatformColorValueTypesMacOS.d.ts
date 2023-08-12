/**
 * @format
 */

// [macOS]

import {ColorValue, OpaqueColorValue} from './StyleSheet';

type DynamicColorMacOSTuple = {
  light: ColorValue;
  dark: ColorValue;
  highContrastLight?: ColorValue | undefined;
  highContrastDark?: ColorValue | undefined;
};

export function DynamicColorMacOS(
  tuple: DynamicColorMacOSTuple,
): OpaqueColorValue;

type SystemEffectMacOS =
  | 'none'
  | 'pressed'
  | 'deepPressed'
  | 'disabled'
  | 'rollover';

export function ColorWithSystemEffectMacOS(
  color: ColorValue,
  effect: SystemEffectMacOS,
): OpaqueColorValue;
