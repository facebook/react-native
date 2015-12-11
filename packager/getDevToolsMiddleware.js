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
var path = require('path');

module.exports = function(options) {
  return function(req, res, next) {
    if (req.url === '/debugger-ui') {
      var debuggerPath = path.join(__dirname, 'debugger.html');
      res.writeHead(200, {'Content-Type': 'text/html'});
      fs.createReadStream(debuggerPath).pipe(res);
    } else if (req.url === '/debuggerWorker.js') {
      var workerPath = path.join(__dirname, 'debuggerWorker.js');
      res.writeHead(200, {'Content-Type': 'application/javascript'});
      fs.createReadStream(workerPath).pipe(res);
    } else if (req.url === '/launch-safari-devtools') {
      // TODO: remove `console.log` and dev tools binary
      console.log(
        'We removed support for Safari dev-tools. ' +
        'If you still need this, please let us know.'
      );
    } else if (req.url === '/launch-chrome-devtools') {
      var debuggerURL = 'http://localhost:' + options.port + '/debugger-ui';
      var script = 'launchChromeDevTools.applescript';
      console.log('Launching Dev Tools...');
      execFile(
        path.join(__dirname, script), [debuggerURL],
        function(err, stdout, stderr) {
          if (err) {
            console.log('Failed to run ' + script, err);
          }
          console.log(stdout);
          console.warn(stderr);
        }
      );
      res.end('OK');
    } else {
      next();
    }
  };
};
