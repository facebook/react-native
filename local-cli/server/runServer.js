/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

require('../../setupBabel')();

const Metro = require('metro');

const HmrServer = require('metro/src/HmrServer');

const {Terminal} = require('metro-core');

const attachWebsocketServer = require('./util/attachWebsocketServer');
const compression = require('compression');
const connect = require('connect');
const copyToClipBoardMiddleware = require('./middleware/copyToClipBoardMiddleware');
const defaultAssetExts = Metro.defaults.assetExts;
const defaultSourceExts = Metro.defaults.sourceExts;
const defaultPlatforms = Metro.defaults.platforms;
const defaultProvidesModuleNodeModules =
  Metro.defaults.providesModuleNodeModules;
const errorhandler = require('errorhandler');
const fs = require('fs');
const getDevToolsMiddleware = require('./middleware/getDevToolsMiddleware');
const http = require('http');
const https = require('https');
const indexPageMiddleware = require('./middleware/indexPage');
const loadRawBodyMiddleware = require('./middleware/loadRawBodyMiddleware');
const messageSocket = require('./util/messageSocket.js');
const morgan = require('morgan');
const openStackFrameInEditorMiddleware = require('./middleware/openStackFrameInEditorMiddleware');
const path = require('path');
const serveStatic = require('serve-static');
const statusPageMiddleware = require('./middleware/statusPageMiddleware.js');
const systraceProfileMiddleware = require('./middleware/systraceProfileMiddleware.js');
const webSocketProxy = require('./util/webSocketProxy.js');

const {ASSET_REGISTRY_PATH} = require('../core/Constants');

import type {ConfigT} from 'metro';
/* $FlowFixMe(site=react_native_oss) */
import type {Reporter} from 'metro/src/lib/reporting';

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

  const terminal = new Terminal(process.stdout);
  /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.68 was deployed. To see the error delete this comment
   * and run Flow. */
  const ReporterImpl = getReporterImpl(args.customLogReporterPath || null);
  const reporter = new ReporterImpl(terminal);
  const packagerServer = getPackagerServer(args, config, reporter);
  startedCallback(reporter);

  const app = connect()
    .use(loadRawBodyMiddleware)
    .use(compression())
    .use(
      '/debugger-ui',
      serveStatic(path.join(__dirname, 'util', 'debugger-ui')),
    )
    .use(
      getDevToolsMiddleware(args, () => wsProxy && wsProxy.isChromeConnected()),
    )
    .use(getDevToolsMiddleware(args, () => ms && ms.isChromeConnected()))
    .use(openStackFrameInEditorMiddleware(args))
    .use(copyToClipBoardMiddleware)
    .use(statusPageMiddleware)
    .use(systraceProfileMiddleware)
    .use(indexPageMiddleware)
    .use(packagerServer.processRequest.bind(packagerServer));

  args.projectRoots.forEach(root => app.use(serveStatic(root)));

  app.use(morgan('combined')).use(errorhandler());

  /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.68 was deployed. To see the error delete this comment
   * and run Flow. */
  if (args.https && (!args.key || !args.cert)) {
    throw new Error('Cannot use https without specifying key and cert options');
  }

  /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.68 was deployed. To see the error delete this comment
   * and run Flow. */
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
    attachWebsocketServer({
      httpServer: serverInstance,
      path: '/hot',
      websocketServer: new HmrServer(packagerServer),
    });

    wsProxy = webSocketProxy.attachToServer(serverInstance, '/debugger-proxy');
    ms = messageSocket.attachToServer(serverInstance, '/message');
    readyCallback(reporter);
  });
  // Disable any kind of automatic timeout behavior for incoming
  // requests in case it takes the packager more than the default
  // timeout of 120 seconds to respond to a request.
  serverInstance.timeout = 0;
}

function getReporterImpl(customLogReporterPath: ?string) {
  if (customLogReporterPath == null) {
    return require('metro/src/lib/TerminalReporter');
  }
  try {
    // First we let require resolve it, so we can require packages in node_modules
    // as expected. eg: require('my-package/reporter');
    /* $FlowFixMe: can't type dynamic require */
    return require(customLogReporterPath);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    /* $FlowFixMe: can't type dynamic require */
    return require(path.resolve(customLogReporterPath));
  }
}

function getPackagerServer(args, config, reporter) {
  /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.68 was deployed. To see the error delete this comment
   * and run Flow. */
  const transformModulePath = args.transformer
    ? path.resolve(args.transformer)
    : config.getTransformModulePath();

  const providesModuleNodeModules =
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    args.providesModuleNodeModules || defaultProvidesModuleNodeModules;

  return Metro.createServer({
    asyncRequireModulePath: config.getAsyncRequireModulePath(),
    assetExts: defaultAssetExts.concat(args.assetExts),
    assetRegistryPath: ASSET_REGISTRY_PATH,
    blacklistRE: config.getBlacklistRE(),
    cacheStores: config.cacheStores,
    cacheVersion: '3',
    enableBabelRCLookup: config.getEnableBabelRCLookup(),
    extraNodeModules: config.extraNodeModules,
    dynamicDepsInPackages: config.dynamicDepsInPackages,
    getModulesRunBeforeMainModule: config.getModulesRunBeforeMainModule,
    getPolyfills: config.getPolyfills,
    getRunModuleStatement: config.getRunModuleStatement,
    getTransformOptions: config.getTransformOptions,
    hasteImplModulePath: config.hasteImplModulePath,
    maxWorkers: args.maxWorkers,
    platforms: defaultPlatforms.concat(args.platforms),
    polyfillModuleNames: config.getPolyfillModuleNames(),
    postMinifyProcess: config.postMinifyProcess,
    postProcessBundleSourcemap: config.postProcessBundleSourcemap,
    projectRoots: args.projectRoots,
    providesModuleNodeModules: providesModuleNodeModules,
    reporter,
    resetCache: args.resetCache,
    resolveRequest: config.resolveRequest,
    sourceExts: args.sourceExts.concat(defaultSourceExts),
    transformModulePath: transformModulePath,
    verbose: args.verbose,
    watch: !args.nonPersistent,
    workerPath: config.getWorkerPath(),
  });
}

module.exports = runServer;
