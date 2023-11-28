/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

function parse(filename) {
  try {
    // $FlowFixMe[unsupported-syntax] Can't require dynamic variables
    return require(filename);
  } catch (err) {
    // Ignore
  }
}
module.exports = {
  parse,
};
