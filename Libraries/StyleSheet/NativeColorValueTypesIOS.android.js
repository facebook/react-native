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

import type {ColorValue} from './ColorValueTypes';

export type IOSDynamicColorTuple = {
  light: ColorValue,
  dark: ColorValue,
};

export const IOSDynamicColor = (tuple: IOSDynamicColorTuple): ColorValue => {
  throw new Error('IOSDynamicColor is not available on this platform.');
};
