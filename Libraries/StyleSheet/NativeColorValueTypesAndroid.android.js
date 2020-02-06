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
import {AndroidColorPrivate} from './NativeColorValueTypes';

export const AndroidColor = (color: string): ColorValue => {
  return AndroidColorPrivate(color);
};
