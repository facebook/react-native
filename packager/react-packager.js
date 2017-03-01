/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Logger = require('./src/Logger');

const debug = require('debug');
const invariant = require('fbjs/lib/invariant');

import type GlobalTransformCache from './src/lib/GlobalTransformCache';
import type {Reporter} from './src/lib/reporting';
import type {HasteImpl} from './src/node-haste/Module';

exports.createServer = createServer;
exports.Logger = Logger;

type Options = {
  hasteImpl?: HasteImpl,
  globalTransformCache: ?GlobalTransformCache,
  nonPersistent?: boolean,
  projectRoots: Array<string>,
  reporter?: Reporter,
  watch?: boolean,
};

type StrictOptions = {
  hasteImpl?: HasteImpl,
  globalTransformCache: ?GlobalTransformCache,
  nonPersistent?: boolean,
  projectRoots: Array<string>,
  reporter: Reporter,
  watch?: boolean,
};

exports.buildBundle = function(options: Options, bundleOptions: {}) {
  var server = createNonPersistentServer(options);
  return server.buildBundle(bundleOptions)
    .then(p => {
      server.end();
      return p;
    });
};

exports.getOrderedDependencyPaths = function(options: Options, bundleOptions: {}) {
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
  var debugPattern = 'RNP:*';
  var existingPattern = debug.load();
  if (existingPattern) {
    debugPattern += ',' + existingPattern;
  }
  debug.enable(debugPattern);
}

function createServer(options: StrictOptions) {
  // the debug module is configured globally, we need to enable debugging
  // *before* requiring any packages that use `debug` for logging
  if (options.verbose) {
    enableDebug();
  }

  // Some callsites may not be Flowified yet.
  invariant(options.reporter != null, 'createServer() requires reporter');
  const serverOptions = Object.assign({}, options);
  delete serverOptions.verbose;
  var Server = require('./src/Server');
  return new Server(serverOptions);
}

function createNonPersistentServer(options: Options) {
  const serverOptions = {
    // It's unsound to set-up the reporter here,
    // but this allows backward compatibility.
    reporter: options.reporter == null
      ? require('./src/lib/reporting').nullReporter
      : options.reporter,
    ...options,
    watch: !options.nonPersistent,
  };
  return createServer(serverOptions);
}
