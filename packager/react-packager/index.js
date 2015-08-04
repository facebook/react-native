/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('babel-core/register')({
  only: /react-packager\/src/
});

useGracefulFs();

var Activity = require('./src/Activity');
var Server = require('./src/Server');

exports.middleware = function(options) {
  var server = new Server(options);
  return server.processRequest.bind(server);
};

exports.buildPackage = function(options, packageOptions) {
  var server = createServer(options);
  return server.buildPackage(packageOptions)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.buildPackageFromUrl = function(options, reqUrl) {
  var server = createServer(options);
  return server.buildPackageFromUrl(reqUrl)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.getDependencies = function(options, main) {
  var server = createServer(options);
  return server.getDependencies(main)
    .then(function(r) {
      server.end();
      return r.dependencies;
    });
};

function useGracefulFs() {
  var fs = require('fs');
  var gracefulFs = require('graceful-fs');

  // A bit sneaky but it's not straightforward to update all the
  // modules we depend on.
  Object.keys(fs).forEach(function(method) {
    if (typeof fs[method] === 'function' && gracefulFs[method]) {
      fs[method] = gracefulFs[method];
    }
  });
}

function createServer(options) {
  Activity.disable();
  // Don't start the filewatcher or the cache.
  if (options.nonPersistent == null) {
    options.nonPersistent = true;
  }

  return new Server(options);
}
