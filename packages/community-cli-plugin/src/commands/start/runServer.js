/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {Config} from '@react-native-community/cli-types';
import type {Reporter} from 'metro/src/lib/reporting';
import type {TerminalReportableEvent} from 'metro/src/lib/TerminalReporter';
import typeof TerminalReporter from 'metro/src/lib/TerminalReporter';
import type Server from 'metro/src/Server';
import type {Middleware} from 'metro-config';

import chalk from 'chalk';
import Metro from 'metro';
import {Terminal} from 'metro-core';
import path from 'path';
import {
  createDevServerMiddleware,
  indexPageMiddleware,
} from '@react-native-community/cli-server-api';
import {
  isPackagerRunning,
  logger,
  version,
  logAlreadyRunningBundler,
  handlePortUnavailable,
} from '@react-native-community/cli-tools';

import loadMetroConfig from '../../utils/loadMetroConfig';
import attachKeyHandlers from './attachKeyHandlers';

export type Args = {
  assetPlugins?: string[],
  cert?: string,
  customLogReporterPath?: string,
  host?: string,
  https?: boolean,
  maxWorkers?: number,
  key?: string,
  platforms?: string[],
  port?: number,
  resetCache?: boolean,
  sourceExts?: string[],
  transformer?: string,
  watchFolders?: string[],
  config?: string,
  projectRoot?: string,
  interactive: boolean,
};

async function runServer(_argv: Array<string>, ctx: Config, args: Args) {
  let port = args.port ?? 8081;
  let packager = true;
  const packagerStatus = await isPackagerRunning(port);

  if (
    typeof packagerStatus === 'object' &&
    packagerStatus.status === 'running'
  ) {
    if (packagerStatus.root === ctx.root) {
      packager = false;
      logAlreadyRunningBundler(port);
    } else {
      const result = await handlePortUnavailable(port, ctx.root, packager);
      [port, packager] = [result.port, result.packager];
    }
  } else if (packagerStatus === 'unrecognized') {
    const result = await handlePortUnavailable(port, ctx.root, packager);
    [port, packager] = [result.port, result.packager];
  }

  if (packager === false) {
    process.exit();
  }

  logger.info(`Starting dev server on port ${chalk.bold(String(port))}`);

  const metroConfig = await loadMetroConfig(ctx, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port: port,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    projectRoot: args.projectRoot,
    sourceExts: args.sourceExts,
  });

  if (args.assetPlugins) {
    // $FlowIgnore[cannot-write] Assigning to readonly property
    metroConfig.transformer.assetPlugins = args.assetPlugins.map(plugin =>
      require.resolve(plugin),
    );
  }

  const {
    middleware,
    websocketEndpoints,
    messageSocketEndpoint,
    eventsSocketEndpoint,
  } = createDevServerMiddleware({
    host: args.host,
    port: metroConfig.server.port,
    watchFolders: metroConfig.watchFolders,
  });
  middleware.use(indexPageMiddleware);

  const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
  // $FlowIgnore[cannot-write] Assigning to readonly property
  metroConfig.server.enhanceMiddleware = (
    metroMiddleware: Middleware,
    server: Server,
  ) => {
    if (customEnhanceMiddleware) {
      return middleware.use(customEnhanceMiddleware(metroMiddleware, server));
    }
    return middleware.use(metroMiddleware);
  };

  let reportEvent: (event: TerminalReportableEvent) => void;
  const terminal = new Terminal(process.stdout);
  const ReporterImpl = getReporterImpl(args.customLogReporterPath);
  const terminalReporter = new ReporterImpl(terminal);
  const reporter: Reporter = {
    update(event: TerminalReportableEvent) {
      terminalReporter.update(event);
      if (reportEvent) {
        reportEvent(event);
      }
      if (args.interactive && event.type === 'dep_graph_loaded') {
        attachKeyHandlers(ctx, messageSocketEndpoint);
      }
    },
  };
  // $FlowIgnore[cannot-write] Assigning to readonly property
  metroConfig.reporter = reporter;

  const serverInstance = await Metro.runServer(metroConfig, {
    host: args.host,
    secure: args.https,
    secureCert: args.cert,
    secureKey: args.key,
    // $FlowFixMe[incompatible-call] Incompatibly defined WebSocketServer type
    websocketEndpoints,
  });

  reportEvent = eventsSocketEndpoint.reportEvent;

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
  serverInstance.keepAliveTimeout = 30000;

  await version.logIfUpdateAvailable(ctx.root);
}

function getReporterImpl(customLogReporterPath?: string): TerminalReporter {
  if (customLogReporterPath == null) {
    return require('metro/src/lib/TerminalReporter');
  }
  try {
    // First we let require resolve it, so we can require packages in node_modules
    // as expected. eg: require('my-package/reporter');
    // $FlowIgnore[unsupported-syntax]
    return require(customLogReporterPath);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    // If that doesn't work, then we next try relative to the cwd, eg:
    // require('./reporter');
    // $FlowIgnore[unsupported-syntax]
    return require(path.resolve(customLogReporterPath));
  }
}

export default runServer;
