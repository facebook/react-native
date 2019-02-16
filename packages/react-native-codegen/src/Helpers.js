/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

function upperCaseFirst(inString: string): string {
  return inString[0].toUpperCase() + inString.slice(1);
}

module.exports = {
  upperCaseFirst,
};
