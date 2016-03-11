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

require('node-haste/lib/fastpath').replace();
useGracefulFs();

var debug = require('debug');
var Activity = require('./src/Activity');

exports.createServer = createServer;
exports.middleware = function(options) {
  var server = createServer(options);
  return server.processRequest.bind(server);
};

exports.Activity = Activity;

// Renamed "package" to "bundle". But maintain backwards
// compat.
exports.buildPackage =
exports.buildBundle = function(options, bundleOptions) {
  var server = createNonPersistentServer(options);
  return server.buildBundle(bundleOptions)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.buildPrepackBundle = function(options, bundleOptions) {
  var server = createNonPersistentServer(options);
  return server.buildPrepackBundle(bundleOptions)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.buildPackageFromUrl =
exports.buildBundleFromUrl = function(options, reqUrl) {
  var server = createNonPersistentServer(options);
  return server.buildBundleFromUrl(reqUrl)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.getDependencies = function(options, bundleOptions) {
  var server = createNonPersistentServer(options);
  return server.getDependencies(bundleOptions)
    .then(function(r) {
      server.end();
      return r.dependencies;
    });
};

exports.createClientFor = function(options) {
  if (options.verbose) {
    enableDebug();
  }
  startSocketInterface();
  return (
    require('./src/SocketInterface')
      .getOrCreateSocketFor(omit(options, ['verbose']))
  );
};

function useGracefulFs() {
  var fs = require('fs');
  var gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);
}

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

  startSocketInterface();
  var Server = require('./src/Server');
  return new Server(omit(options, ['verbose']));
}

function createNonPersistentServer(options) {
  Activity.disable();
  // Don't start the filewatcher or the cache.
  if (options.nonPersistent == null) {
    options.nonPersistent = true;
  }

  return createServer(options);
}

function omit(obj, blacklistedKeys) {
  return Object.keys(obj).reduce((clone, key) => {
    if (blacklistedKeys.indexOf(key) === -1) {
      clone[key] = obj[key];
    }

    return clone;
  }, {});
}

// we need to listen on a socket as soon as a server is created, but only once.
// This file also serves as entry point when spawning a socket server; in that
// case we need to start the server immediately.
var didStartSocketInterface = false;
function startSocketInterface() {
  if (didStartSocketInterface) {
    return;
  }
  didStartSocketInterface = true;
  require('./src/SocketInterface').listenOnServerMessages();
}

if (require.main === module) { // used as entry point
  startSocketInterface();
}
