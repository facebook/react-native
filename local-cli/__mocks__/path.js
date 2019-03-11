/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const mockPath = {};

function reset(platform) {
  Object.assign(mockPath, jest.requireActual('path')[platform]);
}

mockPath.mock = {reset};

reset('posix');

module.exports = mockPath;
