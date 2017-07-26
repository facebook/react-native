/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

require('../../setupBabel')();
const InspectorProxy = require('./util/inspectorProxy.js');
const ReactPackager = require('metro-bundler');
const Terminal = require('metro-bundler/src/lib/Terminal');

const attachHMRServer = require('./util/attachHMRServer');
const connect = require('connect');
const copyToClipBoardMiddleware = require('./middleware/copyToClipBoardMiddleware');
const cpuProfilerMiddleware = require('./middleware/cpuProfilerMiddleware');
const defaultAssetExts = require('metro-bundler/src/defaults').assetExts;
const defaultSourceExts = require('metro-bundler/src/defaults').sourceExts;
const defaultPlatforms = require('metro-bundler/src/defaults').platforms;
const defaultProvidesModuleNodeModules = require('metro-bundler/src/defaults')
  .providesModuleNodeModules;
const fs = require('fs');
const getDevToolsMiddleware = require('./middleware/getDevToolsMiddleware');
const http = require('http');
const https = require('https');
const indexPageMiddleware = require('./middleware/indexPage');
const loadRawBodyMiddleware = require('./middleware/loadRawBodyMiddleware');
const messageSocket = require('./util/messageSocket.js');
const openStackFrameInEditorMiddleware = require('./middleware/openStackFrameInEditorMiddleware');
const path = require('path');
const statusPageMiddleware = require('./middleware/statusPageMiddleware.js');
const systraceProfileMiddleware = require('./middleware/systraceProfileMiddleware.js');
const unless = require('./middleware/unless');
const webSocketProxy = require('./util/webSocketProxy.js');

import type {ConfigT} from '../util/Config';
import type {Reporter} from 'metro-bundler/src/lib/reporting';

export type Args = {|
  +assetExts: $ReadOnlyArray<string>,
  +host: string,
  +maxWorkers: number,
  +nonPersistent: boolean,
  +platforms: $ReadOnlyArray<string>,
  +port: number,
  +projectRoots: $ReadOnlyArray<string>,
  +resetCache: boolean,
  +sourceExts: $ReadOnlyArray<string>,
  +verbose: boolean,
|};

function runServer(
  args: Args,
  config: ConfigT,
  // FIXME: this is weird design. The top-level should pass down a custom
  // reporter rather than passing it up as argument to an event.
  startedCallback: (reporter: Reporter) => mixed,
  readyCallback: (reporter: Reporter) => mixed,
) {
  var wsProxy = null;
  var ms = null;
  const packagerServer = getPackagerServer(args, config);
  startedCallback(packagerServer._reporter);

  const inspectorProxy = new InspectorProxy();
  const app = connect()
    .use(loadRawBodyMiddleware)
    .use(connect.compress())
    .use(
      getDevToolsMiddleware(args, () => wsProxy && wsProxy.isChromeConnected()),
    )
    .use(getDevToolsMiddleware(args, () => ms && ms.isChromeConnected()))
    .use(openStackFrameInEditorMiddleware(args))
    .use(copyToClipBoardMiddleware)
    .use(statusPageMiddleware)
    .use(systraceProfileMiddleware)
    .use(cpuProfilerMiddleware)
    .use(indexPageMiddleware)
    .use(
      unless('/inspector', inspectorProxy.processRequest.bind(inspectorProxy)),
    )
    .use(packagerServer.processRequest.bind(packagerServer));

  args.projectRoots.forEach(root => app.use(connect.static(root)));

  app.use(connect.logger()).use(connect.errorHandler());

  if (args.https && (!args.key || !args.cert)) {
    throw new Error('Cannot use https without specifying key and cert options');
  }

  const serverInstance = args.https
    ? https.createServer(
        {
          key: fs.readFileSync(args.key),
          cert: fs.readFileSync(args.cert),
        },
        app,
      )
    : http.createServer(app);

  serverInstance.listen(args.port, args.host, 511, function() {
    attachHMRServer({
      httpServer: serverInstance,
      path: '/hot',
      packagerServer,
    });

    wsProxy = webSocketProxy.attachToServer(serverInstance, '/debugger-proxy');
    ms = messageSocket.attachToServer(serverInstance, '/message');
    inspectorProxy.attachToServer(serverInstance, '/inspector');
    readyCallback(packagerServer._reporter);
  });
  // Disable any kind of automatic timeout behavior for incoming
  // requests in case it takes the packager more than the default
  // timeout of 120 seconds to respond to a request.
  serverInstance.timeout = 0;
}

function getPackagerServer(args, config) {
  const transformModulePath = args.transformer
    ? path.resolve(args.transformer)
    : typeof config.getTransformModulePath === 'function'
      ? config.getTransformModulePath()
      : undefined;

  const providesModuleNodeModules =
    args.providesModuleNodeModules || defaultProvidesModuleNodeModules;

  let LogReporter;
  if (args.customLogReporterPath) {
    try {
      // First we let require resolve it, so we can require packages in node_modules
      // as expected. eg: require('my-package/reporter');
      /* $FlowFixMe: can't type dynamic require */
      LogReporter = require(args.customLogReporterPath);
    } catch (e) {
      // If that doesn't work, then we next try relative to the cwd, eg:
      // require('./reporter');
      /* $FlowFixMe: can't type dynamic require */
      LogReporter = require(path.resolve(args.customLogReporterPath));
    }
  } else {
    LogReporter = require('metro-bundler/src/lib/TerminalReporter');
  }

  /* $FlowFixMe: Flow is wrong, Node.js docs specify that process.stdout is an
   * instance of a net.Socket (a local socket, not network). */
  const terminal = new Terminal(process.stdout);
  return ReactPackager.createServer({
    assetExts: defaultAssetExts.concat(args.assetExts),
    blacklistRE: config.getBlacklistRE(),
    cacheVersion: '3',
    enableBabelRCLookup: config.getEnableBabelRCLookup(),
    extraNodeModules: config.extraNodeModules,
    getTransformOptions: config.getTransformOptions,
    hasteImpl: config.hasteImpl,
    maxWorkers: args.maxWorkers,
    platforms: defaultPlatforms.concat(args.platforms),
    polyfillModuleNames: config.getPolyfillModuleNames(),
    postMinifyProcess: config.postMinifyProcess,
    postProcessModules: config.postProcessModules,
    projectRoots: args.projectRoots,
    providesModuleNodeModules: providesModuleNodeModules,
    reporter: new LogReporter(terminal),
    resetCache: args.resetCache,
    sourceExts: defaultSourceExts.concat(args.sourceExts),
    transformModulePath: transformModulePath,
    verbose: args.verbose,
    watch: !args.nonPersistent,
    workerPath: config.getWorkerPath(),
  });
}

module.exports = runServer;
