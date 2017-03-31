/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const launchEditor = require('../util/launchEditor');

module.exports = function({projectRoots}) {
  return function(req, res, next) {
    if (req.url === '/open-stack-frame') {
      const frame = JSON.parse(req.rawBody);
      launchEditor(frame.file, frame.lineNumber, projectRoots);
      res.end('OK');
    } else {
      next();
    }
  };
};
