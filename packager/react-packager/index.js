/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('../babelRegisterOnly')([/react-packager\/src/]);

const debug = require('debug');
const Logger = require('./src/Logger');

exports.createServer = createServer;
exports.Logger = Logger;

exports.buildBundle = function(options, bundleOptions) {
  var server = createNonPersistentServer(options);
  return server.buildBundle(bundleOptions)
    .then(p => {
      server.end();
      return p;
    });
};

exports.getOrderedDependencyPaths = function(options, bundleOptions) {
  var server = createNonPersistentServer(options);
  return server.getOrderedDependencyPaths(bundleOptions)
    .then(function(paths) {
      server.end();
      return paths;
    });
};

function enableDebug() {
  // react-packager logs debug messages using the 'debug' npm package, and uses
  // the following prefix throughout.
  // To enable debugging, we need to set our pattern or append it to any
  // existing pre-configured pattern to avoid disabling logging for
  // other packages
  var debugPattern = 'ReactNativePackager:*';
  var existingPattern = debug.load();
  if (existingPattern) {
    debugPattern += ',' + existingPattern;
  }
  debug.enable(debugPattern);
}

function createServer(options) {
  // the debug module is configured globally, we need to enable debugging
  // *before* requiring any packages that use `debug` for logging
  if (options.verbose) {
    enableDebug();
  }

  options = Object.assign({}, options);
  delete options.verbose;
  if (options.reporter == null) {
    // It's unsound to set-up the reporter here, but this allows backward
    // compatibility.
    var TerminalReporter = require('./src/lib/TerminalReporter');
    options.reporter = new TerminalReporter();
  }
  var Server = require('./src/Server');
  return new Server(options);
}

function createNonPersistentServer(options) {
  if (options.reporter == null) {
    // It's unsound to set-up the reporter here, but this allows backward
    // compatibility.
    options.reporter = require('./src/lib/reporting').nullReporter;
  }
  options.watch = !options.nonPersistent;
  return createServer(options);
}
