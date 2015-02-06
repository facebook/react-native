'use strict';

var Activity = require('./src/Activity');
var Server = require('./src/Server');

exports.middleware = function(options) {
  var server = new Server(options);
  return server.processRequest.bind(server);
};

exports.buildPackageFromUrl = function(options, reqUrl) {
  Activity.disable();
  var server = new Server(options);
  return server.buildPackageFromUrl(reqUrl)
    .then(function(p) {
      server.kill();
      return p;
    });
};
