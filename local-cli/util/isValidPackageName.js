/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

function isValidPackageName(name) {
  return name.match(/^[$A-Z_][0-9A-Z_$]*$/i);
}

module.exports = isValidPackageName;
