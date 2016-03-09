/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var execFile = require('child_process').execFile;
var fs = require('fs');
var opn = require('opn');
var path = require('path');

function getChromeAppName() {
  switch (process.platform) {
  case 'darwin':
    return 'google chrome';
  case 'win32':
    return 'chrome';
  default:
    return 'google-chrome';
  }
}

module.exports = function(options, isDebuggerConnected) {
  return function(req, res, next) {
    if (req.url === '/debugger-ui') {
      var debuggerPath = path.join(__dirname, '..', 'util', 'debugger.html');
      res.writeHead(200, {'Content-Type': 'text/html'});
      fs.createReadStream(debuggerPath).pipe(res);
    } else if (req.url === '/debuggerWorker.js') {
      var workerPath = path.join(__dirname, '..', 'util', 'debuggerWorker.js');
      res.writeHead(200, {'Content-Type': 'application/javascript'});
      fs.createReadStream(workerPath).pipe(res);
    } else if (req.url === '/launch-safari-devtools') {
      // TODO: remove `console.log` and dev tools binary
      console.log(
        'We removed support for Safari dev-tools. ' +
        'If you still need this, please let us know.'
      );
    } else if (req.url === '/launch-chrome-devtools') {
      if (isDebuggerConnected()) {
        // Dev tools are already open; no need to open another session
        res.end('OK');
        return;
      }
      var debuggerURL = 'http://localhost:' + options.port + '/debugger-ui';
      console.log('Launching Dev Tools...');
      opn(debuggerURL, {app: [getChromeAppName()]}, function(err) {
        if (err) {
          console.error('Google Chrome exited with error:', err);
        }
      });
      res.end('OK');
    } else {
      next();
    }
  };
};
