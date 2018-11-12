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

const {Terminal} = require('metro-core');

const messageSocket = require('./util/messageSocket');
const morgan = require('morgan');
const path = require('path');
const webSocketProxy = require('./util/webSocketProxy');
const MiddlewareManager = require('./middleware/MiddlewareManager');

/* $FlowFixMe(site=react_native_oss) */
import type {ConfigT} from 'metro-config/src/configTypes.flow';

export type Args = {|
  +assetExts: $ReadOnlyArray<string>,
  +cert: string,
  +customLogReporterPath?: string,
  +host: string,
  +https: boolean,
  +maxWorkers: number,
  +key: string,
  +nonPersistent: boolean,
  +platforms: $ReadOnlyArray<string>,
  +port: number,
  +projectRoot: string,
  +providesModuleNodeModules: Array<string>,
  +resetCache: boolean,
  +sourceExts: $ReadOnlyArray<string>,
  +transformer?: string,
  +verbose: boolean,
  +watchFolders: $ReadOnlyArray<string>,
|};

async function runServer(args: Args, config: ConfigT) {
  const terminal = new Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath || null);
  const reporter = new ReporterImpl(terminal);
  const middlewareManager = new MiddlewareManager(args);

  middlewareManager.getConnectInstance().use(morgan('combined'));

  args.watchFolders.forEach(middlewareManager.serveStatic);

  // $FlowFixMe Metro configuration is immutable.
  config.maxWorkers = args.maxWorkers;
  // $FlowFixMe Metro configuration is immutable.
  config.server.port = args.port;
  // $FlowFixMe Metro configuration is immutable.
  config.reporter = reporter;
  // $FlowFixMe Metro configuration is immutable.
  config.resetCache = args.resetCache;
  // $FlowFixMe Metro configuration is immutable.
  config.projectRoot = args.projectRoot;
  // $FlowFixMe Metro configuration is immutable.
  config.watchFolders = args.watchFolders.slice(0);
  // $FlowFixMe Metro configuration is immutable.
  config.server.enhanceMiddleware = middleware =>
    middlewareManager.getConnectInstance().use(middleware);

  const serverInstance = await Metro.runServer(config, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    hmrEnabled: true,
  });

  const wsProxy = webSocketProxy.attachToServer(
    serverInstance,
    '/debugger-proxy',
  );
  const ms = messageSocket.attachToServer(serverInstance, '/message');
  middlewareManager.attachDevToolsSocket(wsProxy);
  middlewareManager.attachDevToolsSocket(ms);

  // In Node 8, the default keep-alive for an HTTP connection is 5 seconds. In
  // early versions of Node 8, this was implemented in a buggy way which caused
  // some HTTP responses (like those containing large JS bundles) to be
  // terminated early.
  //
  // As a workaround, arbitrarily increase the keep-alive from 5 to 30 seconds,
  // which should be enough to send even the largest of JS bundles.
  //
  // For more info: https://github.com/nodejs/node/issues/13391
  //
  // $FlowFixMe (site=react_native_fb)
  serverInstance.keepAliveTimeout = 30000;
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

module.exports = runServer;
