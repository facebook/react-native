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
var Activity = require('./react-packager/src/Activity');

var hasWarned = {};
var DISABLE_FLOW_CHECK = true; // temporarily disable while we figure out versioning issues.

function getFlowTypeCheckMiddleware(options) {
  return function(req, res, next) {
    var isBundle = req.url.indexOf('.bundle') !== -1;
    if (DISABLE_FLOW_CHECK || options.skipflow || !isBundle) {
      return next();
    }
    if (options.flowroot || options.projectRoots.length === 1) {
      var flowroot = options.flowroot || options.projectRoots[0];
    } else {
      if (!hasWarned.noRoot) {
        hasWarned.noRoot = true;
        console.warn('flow: No suitable root');
      }
      return next();
    }
    exec('command -v flow >/dev/null 2>&1', function(error, stdout) {
      if (error) {
        if (!hasWarned.noFlow) {
          hasWarned.noFlow = true;
          console.warn(chalk.yellow('flow: Skipping because not installed.  Install with ' +
            '`brew install flow`.'));
        }
        return next();
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
        var error = {
          status: 500,
          message: 'Flow found type errors.  If you think these are wrong, ' +
            'make sure your flow bin and .flowconfig are up to date, or ' +
            'disable with --skipflow.',
          type: 'FlowError',
          errors: errors,
        };
        console.error(chalk.yellow('flow: Error running command `' + flowCmd +
          '`:\n' + JSON.stringify(error))
        );
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
        } else {
          if (!hasWarned.brokenFlow) {
            hasWarned.brokenFlow = true;
            console.warn(chalk.yellow(
              'Flow failed to provide parseable output:\n\n`' + stdout +
              '`.\n' + 'stderr: `' + stderr + '`'
            ));
          }
        }
        return next();
      }
    }
  });
}

module.exports = getFlowTypeCheckMiddleware;
