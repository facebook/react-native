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

import type {NativeColorValue} from './NativeColorValueTypes';
import {
  PlatformColor,
  normalizeColorObject,
  processColorObject,
} from './NativeColorValueTypes';

export type {NativeColorValue};
export {PlatformColor, normalizeColorObject, processColorObject};

export type ColorValue = null | string | NativeColorValue;

export type ProcessedColorValue = number | NativeColorValue;
