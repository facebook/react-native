/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
