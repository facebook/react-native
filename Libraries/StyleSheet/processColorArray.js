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

const processColor = require('./processColor');

function processColorArray(colors: ?Array<string>): ?Array<?number> {
  return colors == null ? null : colors.map(processColor);
}

module.exports = processColorArray;
