/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

module.exports = function(req, res, next) {
  if (req.url !== '/jscheapcaptureupload') {
    next();
    return;
  }

  console.log('Receiving heap capture...');
  var captureName = '/tmp/capture_' + Date.now() + '.json';
  fs.writeFileSync(captureName, req.rawBody);
  console.log('Capture written to ' + captureName);
  res.end();
};
