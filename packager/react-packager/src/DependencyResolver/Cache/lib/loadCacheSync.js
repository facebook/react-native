/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('graceful-fs');

function loadCacheSync(cachePath) {
  if (!fs.existsSync(cachePath)) {
    return Object.create(null);
  }

  try {
    return JSON.parse(fs.readFileSync(cachePath));
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.warn('Unable to parse cache file. Will clear and continue.');
      try {
        fs.unlinkSync(cachePath);
      } catch (err) {
        // Someone else might've deleted it.
      }
      return Object.create(null);
    }
    throw e;
  }
}

module.exports = loadCacheSync;
