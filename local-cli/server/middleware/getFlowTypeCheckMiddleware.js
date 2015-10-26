/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var chalk = require('chalk');
var exec = require('child_process').exec;
var url = require('url');
var Activity = require('../../../packager/react-packager').Activity;

var hasWarned = {};

function getFlowTypeCheckMiddleware(options) {
  return function(req, res, next) {
    var reqObj = url.parse(req.url);
    var isFlowCheck =  (reqObj.path.match(/^\/flow\//));

    if (!isFlowCheck) {
      return next();
    }
    if (options.skipflow) {
      _endSkipFlow(res);
      return;
    }
    if (options.flowroot || options.projectRoots.length === 1) {
      var flowroot = options.flowroot || options.projectRoots[0];
    } else {
      if (!hasWarned.noRoot) {
        hasWarned.noRoot = true;
        console.warn('flow: No suitable root');
      }
      _endFlowBad(res);
      return;
    }
    exec('command -v flow >/dev/null 2>&1', function(error, stdout) {
      if (error) {
        if (!hasWarned.noFlow) {
          hasWarned.noFlow = true;
          console.warn(chalk.yellow('flow: Skipping because not installed.  Install with ' +
            '`brew install flow`.'));
        }
        _endFlowBad(res);
        return;
      } else {
        return doFlowTypecheck(res, flowroot, next);
      }
    });
  };
}

function doFlowTypecheck(res, flowroot, next) {
  var flowCmd = 'cd "' + flowroot + '" && flow --json --timeout 20';
  var eventId = Activity.startEvent('flow static typechecks');
  exec(flowCmd, function(flowError, stdout, stderr) {
    Activity.endEvent(eventId);
    if (!flowError) {
      _endFlowOk(res);
      return;
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
        var error = {
          status: 200,
          message: 'Flow found type errors.  If you think these are wrong, ' +
            'make sure your flow bin and .flowconfig are up to date, or ' +
            'disable with --skipflow.',
          type: 'FlowError',
          errors: errors,
        };
        res.writeHead(error.status, {
          'Content-Type': 'application/json; charset=UTF-8',
        });
        res.end(JSON.stringify(error));
      } catch (e) {
        if (stderr.match(/Could not find a \.flowconfig/)) {
          if (!hasWarned.noConfig) {
            hasWarned.noConfig = true;
            console.warn(chalk.yellow('flow: ' + stderr));
          }
          _endFlowBad(res);
        } else if (flowError.code === 3) {
          if (!hasWarned.timeout) {
            hasWarned.timeout = true;
            console.warn(chalk.yellow('flow: ' + stdout));
          }
          _endSkipFlow(res);
        } else {
          if (!hasWarned.brokenFlow) {
            hasWarned.brokenFlow = true;
            console.warn(chalk.yellow(
              'Flow failed to provide parseable output:\n\n`' + stdout +
              '`.\n' + 'stderr: `' + stderr + '`'
            ));
          }
          _endFlowBad(res);
        }
        return;
      }
    }
  });
}

function _endRes(res, message, code, silentError) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=UTF-8',
  });
  res.end(JSON.stringify({
    message: message,
    errors: [],
    silentError: silentError,
  }));
}

function _endFlowOk(res) {
  _endRes(res, 'No Flow Error', '200', true);
}

function _endFlowBad(res) {
  // we want to show that flow failed
  // status 200 is need for the fetch to not be rejected
  _endRes(res, 'Flow failed to run! Please look at the console for more details.', '200', false);
}

function _endSkipFlow(res) {
  _endRes(res, 'Flow was skipped, check the server options', '200', true);
}

module.exports = getFlowTypeCheckMiddleware;
