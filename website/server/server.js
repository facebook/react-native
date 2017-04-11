/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
const connect = require('connect');
const convert = require('./convert.js');
const http = require('http');
const optimist = require('optimist');
const path = require('path');
const reactMiddleware = require('react-page-middleware');

const argv = optimist.argv;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FILE_SERVE_ROOT = path.join(PROJECT_ROOT, 'src');

let port = argv.port;
if (argv.$0.indexOf('node ./server/generate.js') !== -1) {
  // Using a different port so that you can publish the website
  // and keeping the server up at the same time.
  port = 8079;
}

const buildOptions = {
  projectRoot: PROJECT_ROOT,
  pageRouteRoot: FILE_SERVE_ROOT,
  useBrowserBuiltins: false,
  logTiming: true,
  useSourceMaps: true,
  ignorePaths: function(p) {
    return p.indexOf('__tests__') !== -1;
  },
  serverRender: true,
  dev: argv.dev !== 'false',
  static: true
};

const app = connect()
  .use(function(req, res, next) {
    // convert all the md files on every request. This is not optimal
    // but fast enough that we don't really need to care right now.
    if (!server.noconvert && req.url.match(/\.html|\/$/)) {
      var extractDocs = req.url.match(/\/docs/); // Lazily extract docs.
      convert({extractDocs});
    }
    next();
  })
  .use(reactMiddleware.provide(buildOptions))
  .use(connect.static(FILE_SERVE_ROOT))
  .use(connect.favicon(path.join(FILE_SERVE_ROOT, 'react-native', 'img', 'favicon.png')))
  .use(connect.logger())
  .use(connect.compress())
  .use(connect.errorHandler());

const portToUse = port || 8079;
const server = http.createServer(app);
server.listen(portToUse, function(){
  console.log('Open http://localhost:' + portToUse + '/react-native/index.html');
});
module.exports = server;
