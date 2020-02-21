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

import type {ColorValue} from './StyleSheetTypes';

export type DynamicColorIOSTuple = {
  light: ColorValue,
  dark: ColorValue,
};

export const DynamicColorIOS = (tuple: DynamicColorIOSTuple): ColorValue => {
  throw new Error('DynamicColorIOS is not available on this platform.');
};
