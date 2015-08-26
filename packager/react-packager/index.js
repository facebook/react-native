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

exports.getDependencies = function(options, main) {
  var server = createServer(options);
  return server.getDependencies(main)
    .then(function(r) {
      server.end();
      return r.dependencies;
    });
};

exports.createClientFor = function(options) {
  return SocketInterface.getOrCreateSocketFor(options);
};

process.on('message', function(m) {
  if (m && m.type && m.type === 'createSocketServer') {
    console.log('server got ipc message', m);
    var options = m.data.options;

    // regexp doesn't naturally serialize to json.
    options.blacklistRE = new RegExp(options.blacklistRE.source);

    SocketInterface.createSocketServer(
      m.data.sockPath,
      m.data.options
    ).then(
      function() {
        console.log('succesfully created server', m);
        process.send({ type: 'createdServer' });
      },
      function(error) {
        console.log('error creating server', error.code);
        if (error.code === 'EADDRINUSE') {
          // Server already listening, this may happen if multiple
          // clients where started in quick succussion (buck).
          process.send({ type: 'createdServer' });
        } else {
          throw error;
        }
      }
    ).done();
  }
});

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
