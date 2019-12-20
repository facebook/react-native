/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ColorValue, ProcessedColorValue} from './ColorValueTypes';

export opaque type NativeColorValue = {
  hypothetical_android_color?: Array<string>,
};

export const PlatformColor = (...names: Array<string>): ColorValue => {
  return {hypothetical_android_color: names};
};

export const IOSDynamicColor = (
  object: Object, // flowlint-line unclear-type: off
): ColorValue => {
  return null;
};

export type AndroidColorTuple = {
  hypothetical_android_color: string,
};

export const AndroidHypotheticalColor = (
  tuple: AndroidColorTuple,
): ColorValue => {
  return {hypothetical_android_color: [tuple.hypothetical_android_color]};
};

export const normalizeColorObject = (
  color: NativeColorValue,
): ?ProcessedColorValue => {
  return null;
};

export const processColorObject = (
  color: NativeColorValue,
): ?NativeColorValue => {
  return null;
};
