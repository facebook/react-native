/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Promise = require('promise');
const writeFile = require('../writeFile');

function writeSourcemap(fileName, contents, log) {
  if (!fileName) {
    return Promise.resolve();
  }
  log('Writing sourcemap output to:', fileName);
  const writeMap = writeFile(fileName, contents, null);
  writeMap.then(() => log('Done writing sourcemap output'));
  return writeMap;
}

module.exports = writeSourcemap;
