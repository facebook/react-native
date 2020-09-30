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

export type NativeOrDynamicColorType = {
  semantic?: string,
  dynamic?: {
    light: ?(string | number | NativeOrDynamicColorType),
    dark: ?(string | number | NativeOrDynamicColorType),
  },
};
