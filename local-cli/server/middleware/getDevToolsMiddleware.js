/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var child_process = require('child_process');
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

function launchChromeDevTools(port) {
  var debuggerURL = 'http://localhost:' + port + '/debugger-ui';
  console.log('Launching Dev Tools...');
  opn(debuggerURL, {app: [getChromeAppName()]}, function(err) {
    if (err) {
      console.error('Google Chrome exited with error:', err);
    }
  });
}

function escapePath(path) {
  return '"' + path + '"'; // " Can escape paths with spaces in OS X, Windows, and *nix
}

function launchDevTools(options, isChromeConnected) {
  // Explicit config always wins
  var customDebugger = process.env.REACT_DEBUGGER;
  if (customDebugger) {
    var projects = options.projectRoots.map(escapePath).join(' ');
    var command = customDebugger + ' ' + projects;
    console.log('Starting custom debugger by executing: ' + command);
    child_process.exec(command, function (error, stdout, stderr) {
      if (error !== null) {
        console.log('Error while starting custom debugger: ' + error);
      }
    });
  } else if (!isChromeConnected()) {
    // Dev tools are not yet open; we need to open a session
    launchChromeDevTools(options.port);
  }
}

module.exports = function(options, isChromeConnected) {
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
      // TODO: Remove this case in the future
      console.log(
        'The method /launch-chrome-devtools is deprecated. You are ' +
        ' probably using an application created with an older CLI with the ' + 
        ' packager of a newer CLI. Please upgrade your application: ' +
        'https://facebook.github.io/react-native/docs/upgrading.html');
        launchDevTools(options, isChromeConnected);
        res.end('OK');
    } else if (req.url === '/launch-js-devtools') {
      launchDevTools(options, isChromeConnected);
      res.end('OK');
    } else {
      next();
    }
  };
};
