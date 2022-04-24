/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  capitalize,
};
