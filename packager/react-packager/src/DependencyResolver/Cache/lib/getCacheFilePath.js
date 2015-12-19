/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const crypto = require('crypto');
const path = require('path');

function getCacheFilePath(tmpdir, ...args) {
  const hash = crypto.createHash('md5');
  args.forEach(arg => hash.update(arg));
  return path.join(tmpdir, hash.digest('hex'));
}

module.exports = getCacheFilePath;
