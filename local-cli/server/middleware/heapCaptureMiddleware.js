/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/*eslint no-console-disallow: "off"*/

const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

module.exports = function(req, res, next) {
  if (req.url !== '/jscheapcaptureupload') {
    next();
    return;
  }

  console.log('Downloading Heap Capture');
  var preload = path.join(__dirname, 'heapCapture/preLoadedCapture.js');
  fs.writeFileSync(preload, 'var preLoadedCapture = ');
  fs.appendFileSync(preload, req.rawBody);
  fs.appendFileSync(preload, ';');
  res.end();
  const captureDir = path.join(__dirname, 'heapCapture/captures');
  if (!fs.existsSync(captureDir)) {
    fs.mkdirSync(captureDir);
  }
  console.log('Packaging Trace');
  var captureHtml = captureDir + '/capture_' + Date.now() + '.html';
  var capture = fs.createWriteStream(captureHtml);
  var inliner = spawn(
    'inliner',
    ['--nocompress', 'heapCapture.html'],
    { cwd: path.join(__dirname, '/heapCapture/'),
      stdio: [ process.stdin, 'pipe', process.stderr ],
    });
  inliner.stdout.pipe(capture);
  inliner.on('error', (err) => {
    console.error('Error processing heap capture: ' + err.message);
    console.error('make sure you have installed inliner with \'npm install inliner -g\'');
  });
  inliner.on('exit', (code, signal) => {
    if (code === 0) {
      console.log('Heap capture written to: ' + captureHtml);
    } else {
      console.error('Error processing heap capture, inliner returned code: ' + code);
    }
  });
};
