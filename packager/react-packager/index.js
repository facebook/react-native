/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var Activity = require('./src/Activity');
var Server = require('./src/Server');

exports.middleware = function(options) {
  var server = new Server(options);
  return server.processRequest.bind(server);
};

exports.buildPackageFromUrl = function(options, reqUrl) {
  Activity.disable();
  // Don't start the filewatcher or the cache.
  if (options.nonPersistent == null) {
    options.nonPersistent = true;
  }

  var server = new Server(options);
  return server.buildPackageFromUrl(reqUrl)
    .then(function(p) {
      server.end();
      return p;
    });
};

exports.getDependencies = function(options, main) {
  Activity.disable();
  // Don't start the filewatcher or the cache.
  if (options.nonPersistent == null) {
    options.nonPersistent = true;
  }

  var server = new Server(options);
  return server.getDependencies(main)
    .then(function(r) {
      server.end();
      return r.dependencies;
    });
};
