/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function(req, res, next) {
  if (req.url === '/') {
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  } else {
    next();
  }
};
