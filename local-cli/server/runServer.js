/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const InspectorProxy = require('./util/inspectorProxy.js');
const ReactPackager = require('../../packager/react-packager');

const attachHMRServer = require('./util/attachHMRServer');
const connect = require('connect');
const copyToClipBoardMiddleware = require('./middleware/copyToClipBoardMiddleware');
const cpuProfilerMiddleware = require('./middleware/cpuProfilerMiddleware');
const defaultAssetExts = require('../../packager/defaults').assetExts;
const defaultPlatforms = require('../../packager/defaults').platforms;
const defaultProvidesModuleNodeModules = require('../../packager/defaults').providesModuleNodeModules;
const getDevToolsMiddleware = require('./middleware/getDevToolsMiddleware');
const heapCaptureMiddleware = require('./middleware/heapCaptureMiddleware.js');
const http = require('http');
const indexPageMiddleware = require('./middleware/indexPage');
const loadRawBodyMiddleware = require('./middleware/loadRawBodyMiddleware');
const messageSocket = require('./util/messageSocket.js');
const openStackFrameInEditorMiddleware = require('./middleware/openStackFrameInEditorMiddleware');
const path = require('path');
const statusPageMiddleware = require('./middleware/statusPageMiddleware.js');
const systraceProfileMiddleware = require('./middleware/systraceProfileMiddleware.js');
const unless = require('./middleware/unless');
const webSocketProxy = require('./util/webSocketProxy.js');

function runServer(args, config, readyCallback) {
  var wsProxy = null;
  var ms = null;
  const packagerServer = getPackagerServer(args, config);
  const inspectorProxy = new InspectorProxy();
  const app = connect()
    .use(loadRawBodyMiddleware)
    .use(connect.compress())
    .use(getDevToolsMiddleware(args, () => wsProxy && wsProxy.isChromeConnected()))
    .use(getDevToolsMiddleware(args, () => ms && ms.isChromeConnected()))
    .use(openStackFrameInEditorMiddleware(args))
    .use(copyToClipBoardMiddleware)
    .use(statusPageMiddleware)
    .use(systraceProfileMiddleware)
    .use(heapCaptureMiddleware)
    .use(cpuProfilerMiddleware)
    .use(indexPageMiddleware)
    .use(unless('/inspector', inspectorProxy.processRequest.bind(inspectorProxy)))
    .use(packagerServer.processRequest.bind(packagerServer));

  args.projectRoots.forEach(root => app.use(connect.static(root)));

  app.use(connect.logger())
    .use(connect.errorHandler());

  const serverInstance = http.createServer(app).listen(
    args.port,
    args.host,
    function() {
      attachHMRServer({
        httpServer: serverInstance,
        path: '/hot',
        packagerServer,
      });

      wsProxy = webSocketProxy.attachToServer(serverInstance, '/debugger-proxy');
      ms = messageSocket.attachToServer(serverInstance, '/message');
      inspectorProxy.attachToServer(serverInstance, '/inspector');
      readyCallback();
    }
  );
  // Disable any kind of automatic timeout behavior for incoming
  // requests in case it takes the packager more than the default
  // timeout of 120 seconds to respond to a request.
  serverInstance.timeout = 0;
}

function getPackagerServer(args, config) {
  const transformModulePath =
    args.transformer ? path.resolve(args.transformer) :
    typeof config.getTransformModulePath === 'function' ? config.getTransformModulePath() :
    undefined;

  const providesModuleNodeModules =
    args.providesModuleNodeModules || defaultProvidesModuleNodeModules;

  let LogReporter;
  if (args.customLogReporterPath) {
    try {
      // First we let require resolve it, so we can require packages in node_modules
      // as expected. eg: require('my-package/reporter');
      LogReporter = require(args.customLogReporterPath);
    } catch(e) {
      // If that doesn't work, then we next try relative to the cwd, eg:
      // require('./reporter');
      LogReporter = require(path.resolve(args.customLogReporterPath));
    }
  } else {
    LogReporter = require('../../packager/src/lib/TerminalReporter');
  }

  return ReactPackager.createServer({
    assetExts: defaultAssetExts.concat(args.assetExts),
    blacklistRE: config.getBlacklistRE(),
    cacheVersion: '3',
    extraNodeModules: config.extraNodeModules,
    getTransformOptions: config.getTransformOptions,
    hasteImpl: config.hasteImpl,
    platforms: defaultPlatforms.concat(args.platforms),
    projectRoots: args.projectRoots,
    providesModuleNodeModules: providesModuleNodeModules,
    reporter: new LogReporter(),
    resetCache: args.resetCache,
    transformModulePath: transformModulePath,
    verbose: args.verbose,
    watch: !args.nonPersistent,
  });
}

module.exports = runServer;
