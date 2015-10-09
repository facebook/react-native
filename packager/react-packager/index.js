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

useGracefulFs();

var Activity = require('./src/Activity');
var Server = require('./src/Server');
var SocketInterface = require('./src/SocketInterface');

exports.middleware = function(options) {
  var server = new Server(options);
  return server.processRequest.bind(server);
};

exports.Activity = Activity;

// Renamed "package" to "bundle". But maintain backwards
// compat.
exports.buildPackage =
exports.buildBundle = function(options, bundleOptions) {
  var server = createServer(options);
  return server.buildBundle(bundleOptions)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.buildPackageFromUrl =
exports.buildBundleFromUrl = function(options, reqUrl) {
  var server = createServer(options);
  return server.buildBundleFromUrl(reqUrl)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.getDependencies = function(options, bundleOptions) {
  var server = createServer(options);
  return server.getDependencies(bundleOptions)
    .then(function(r) {
      server.end();
      return r.dependencies;
    });
};

exports.createClientFor = function(options) {
  return SocketInterface.getOrCreateSocketFor(options);
};

SocketInterface.listenOnServerMessages();

function useGracefulFs() {
  var fs = require('fs');
  var gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);
}

function createServer(options) {
  Activity.disable();
  // Don't start the filewatcher or the cache.
  if (options.nonPersistent == null) {
    options.nonPersistent = true;
  }

  return new Server(options);
}
