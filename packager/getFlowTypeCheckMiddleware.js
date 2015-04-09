/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var exec = require('child_process').exec;

function getFlowTypeCheckMiddleware(options) {
  return function(req, res, next) {
    if (options.skipflow) {
      return next();
    }
    if (options.flowroot || options.projectRoots.length === 1) {
      var flowroot = options.flowroot || options.projectRoots[0];
    } else {
      console.warn('flow: No suitable root');
      return next();
    }
    exec('command -v flow >/dev/null 2>&1', function(error, stdout) {
      if (error) {
        console.warn('flow: Skipping because not installed.  Install with ' +
          '`brew install flow`.');
        return next();
      } else {
        return doFlowTypecheck(res, flowroot, next);
      }
    });
  };
}

function doFlowTypecheck(res, flowroot, next) {
  // vjeux: big hack to make it work on the sample app because we don't generate a
  // .flowconfig in the init script right now.
  return next();

  var flowCmd = 'cd "' + flowroot + '" && flow --json --timeout 20';
  var start = Date.now();
  console.log('flow: Running static typechecks.');
  exec(flowCmd, function(flowError, stdout) {
    if (!flowError) {
      console.log('flow: Typechecks passed (' + (Date.now() - start) + 'ms).');
      return next();
    } else {
      try {
        var flowResponse = JSON.parse(stdout);
        var errors = [];
        var errorNum = 1;
        flowResponse.errors.forEach(function(err) {
          // flow errors are paired across callsites, so we indent and prefix to
          // group them
          var indent = '';
          err.message.forEach(function(msg) {
            errors.push({
              description: indent + 'E' + errorNum + ': ' + msg.descr,
              filename: msg.path,
              lineNumber: msg.line,
              column: msg.start,
            });
            indent = '  ';
          });
          errorNum++;
        });
        var message = 'Flow found type errors.  If you think these are wrong, ' +
          'make sure flow is up to date, or disable with --skipflow.';
      } catch (e) {
        var message =
          'Flow failed to provide parseable output:\n\n`' + stdout + '`';
        console.error(message, '\nException: `', e, '`\n\n');
      }
      var error = {
        status: 500,
        message: message,
        type: 'FlowError',
        errors: errors,
      };
      console.error('flow: Error running command `' + flowCmd + '`:\n', error);
      res.writeHead(error.status, {
        'Content-Type': 'application/json; charset=UTF-8',
      });
      res.end(JSON.stringify(error));
    }
  });
}

module.exports = getFlowTypeCheckMiddleware;
