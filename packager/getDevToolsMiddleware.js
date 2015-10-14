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
var launcher = require('browser-launcher2');

function closeChromeInstance(instance) {
  return new Promise(function(resolve, reject) {
    if (!instance) {
      resolve();
      return;
    }
    instance.stop(function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function launchChrome(url, options) {
  return new Promise(function(resolve, reject) {
    launcher(function(err, launch) {
      if (err) {
        console.error('Failed to initialize browser-launcher2', err);
        reject(err);
        return;
      }
      launch(url, {
        browser: 'chrome',
        options: options,
      }, function(err, instance) {
        if (err) {
          console.error('Failed to launch chrome', err);
          reject(err);
          return;
        }
        resolve(instance);
      });
    });
  });
}

module.exports = function(options, isDebuggerConnected) {
  var chromeInstance;
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
      if (isDebuggerConnected()) {
        // Dev tools are already open; no need to open another session
        res.end('OK');
        return;
      }
      var debuggerURL = 'http://localhost:' + options.port + '/debugger-ui';
      var chromeOptions =
        options.dangerouslyDisableChromeDebuggerWebSecurity ?
          ['--disable-web-security'] :
          [];
      console.log('Launching Dev Tools...');
      closeChromeInstance(chromeInstance)
        .then(function() {
          return launchChrome(debuggerURL, chromeOptions)
        })
        .then(function(instance) {
          // Keep a reference to the Chrome instance and unset it if Chrome stops
          chromeInstance = instance;
          chromeInstance.on('stop', function() {
            chromeInstance = null;
          });
          res.end('OK');
        })
        .catch(function(err) {
          next(err);
        });
    } else {
      next();
    }
  };
};
