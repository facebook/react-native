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

export const ColorAndroid = (color: string): ColorValue => {
  throw new Error('ColorAndroid is not available on this platform.');
};
