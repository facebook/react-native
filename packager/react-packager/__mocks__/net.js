/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var EventEmitter = require('events').EventEmitter;
var servers = {};
exports.createServer = function(listener) {
  var server = {
    _listener: listener,

    socket: new EventEmitter(),

    listen: function(path) {
      listener(this.socket);
      servers[path] = this;
    }
  };

  server.socket.setEncoding = function() {};
  server.socket.write = function(data) {
    this.emit('data', data);
  };

  return server;
};

exports.connect = function(options) {
  var server = servers[options.path || options.port];
  return server.socket;
};
