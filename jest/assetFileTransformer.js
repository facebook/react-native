/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');

module.exports = {
  // Mocks asset requires to return the filename. Makes it possible to test that
  // the correct images are loaded for components. So require('img1.png')
  // becomes 'img1.png' in the Jest snapshot.
  process: (_, filename) =>
    `module.exports = ${JSON.stringify(path.basename(filename))};`
};
