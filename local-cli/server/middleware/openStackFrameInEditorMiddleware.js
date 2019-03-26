/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const launchEditor = require('../util/launchEditor');

module.exports = function({watchFolders}) {
  return function(req, res, next) {
    if (req.url === '/open-stack-frame') {
      const frame = JSON.parse(req.rawBody);
      launchEditor(frame.file, frame.lineNumber, watchFolders);
      res.end('OK');
    } else {
      next();
    }
  };
};
