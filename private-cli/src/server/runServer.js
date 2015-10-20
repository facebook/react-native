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
// TODO: move middlewares to private-cli/src/server
const cpuProfilerMiddleware = require('../../../packager/cpuProfilerMiddleware');
const getDevToolsMiddleware = require('../../../packager/getDevToolsMiddleware');
const http = require('http');
const isAbsolutePath = require('absolute-path');
const loadRawBodyMiddleware = require('../../../packager/loadRawBodyMiddleware');
const openStackFrameInEditorMiddleware = require('../../../packager/openStackFrameInEditorMiddleware');
const path = require('path');
const ReactPackager = require('../../../packager/react-packager');
const statusPageMiddleware = require('../../../packager/statusPageMiddleware.js');
const systraceProfileMiddleware = require('../../../packager/systraceProfileMiddleware.js');

function runServer(args, config, readyCallback) {
  const app = connect()
    .use(loadRawBodyMiddleware)
    .use(getDevToolsMiddleware(args))
    .use(openStackFrameInEditorMiddleware)
    .use(statusPageMiddleware)
    .use(systraceProfileMiddleware)
    .use(cpuProfilerMiddleware)
    // Temporarily disable flow check until it's more stable
    //.use(getFlowTypeCheckMiddleware(args))
    .use(getAppMiddleware(args, config));

  args.projectRoots.forEach(root => app.use(connect.static(root)));

  app.use(connect.logger())
    .use(connect.compress())
    .use(connect.errorHandler());

  return http.createServer(app).listen(args.port, '::', readyCallback);
}

function getAppMiddleware(args, config) {
  let transformerPath = args.transformer;
  if (!isAbsolutePath(transformerPath)) {
    transformerPath = path.resolve(process.cwd(), transformerPath);
  }

  return ReactPackager.middleware({
    nonPersistent: args.nonPersistent,
    projectRoots: args.projectRoots,
    blacklistRE: config.getBlacklistRE(),
    cacheVersion: '3',
    transformModulePath: transformerPath,
    assetRoots: args.assetRoots,
    assetExts: ['png', 'jpeg', 'jpg'],
    resetCache: args.resetCache || args['reset-cache'],
    polyfillModuleNames: [
      require.resolve(
        '../../../Libraries/JavaScriptAppEngine/polyfills/document.js'
      ),
    ],
    verbose: args.verbose,
  });
}

module.exports = runServer;
