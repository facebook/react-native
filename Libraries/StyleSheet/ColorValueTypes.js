/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {NativeColorValue} from './NativeColorValueTypes';
import {PlatformColor} from './NativeColorValueTypes';

export type {NativeColorValue};
export {PlatformColor};

export type ColorValue = null | string | NativeColorValue;

export type ProcessedColorValue = number | NativeColorValue;
