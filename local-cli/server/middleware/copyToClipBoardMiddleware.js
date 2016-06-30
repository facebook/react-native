/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const copyToClipBoard = require('../util/copyToClipBoard');
var chalk = require('chalk');

/**
 * Handle the request from JS to copy contents onto host system clipboard.
 * This is only supported on Mac for now.
 */
module.exports = function(req, res, next) {
  if (req.url === '/copy-to-clipboard') {
    var ret = copyToClipBoard(req.rawBody);
    if (!ret) {
      console.warn(chalk.red('Copy button is not supported on this platform!'));
    }
    res.end('OK');
  } else {
    next();
  }
};
