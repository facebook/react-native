/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {NativeColorValue} from './ColorValueTypes';

function processColorObject(color: NativeColorValue): ?NativeColorValue {
  if ('dynamic' in color && color.dynamic !== undefined) {
    const processColor = require('./processColor');
    const dynamic = color.dynamic;
    const dynamicColor: NativeColorValue = {
      dynamic: {
        light: processColor(dynamic.light),
        dark: processColor(dynamic.dark),
      },
    };
    return dynamicColor;
  }
  return color;
}

module.exports = processColorObject;
