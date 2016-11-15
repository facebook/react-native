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

const fs = require('fs');

function writeFile(file, data, encoding) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      file,
      data,
      encoding,
      error => error ? reject(error) : resolve()
    );
  });
}

module.exports = writeFile;
