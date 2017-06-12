/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const mockFS = require('mock-fs');

/**
 * @see https://github.com/tschaub/mock-fs/issues/208
 */
mockFS();
if (!fs.statSync(process.cwd()).isDirectory()) {
  test.only('skipping tests because of mock-fs bug in Node v8.x.x', () => {});
}
mockFS.restore();
