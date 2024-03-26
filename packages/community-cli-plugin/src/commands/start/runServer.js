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

import isDevServerRunning from '../../utils/isDevServerRunning';
import loadMetroConfig from '../../utils/loadMetroConfig';
import attachKeyHandlers from './attachKeyHandlers';
import {
  createDevServerMiddleware,
  indexPageMiddleware,
} from '@react-native-community/cli-server-api';
import {logger, version} from '@react-native-community/cli-tools';
import {createDevMiddleware} from '@react-native/dev-middleware';
import chalk from 'chalk';
import Metro from 'metro';
import {Terminal} from 'metro-core';
import path from 'path';
import url from 'url';

export type StartCommandArgs = {
  assetPlugins?: string[],
  cert?: string,
  customLogReporterPath?: string,
  experimentalDebugger: boolean,
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

async function runServer(
  _argv: Array<string>,
  ctx: Config,
  args: StartCommandArgs,
) {
  const metroConfig = await loadMetroConfig(ctx, {
    config: args.config,
    maxWorkers: args.maxWorkers,
    port: args.port,
    resetCache: args.resetCache,
    watchFolders: args.watchFolders,
    projectRoot: args.projectRoot,
    sourceExts: args.sourceExts,
  });
  const hostname = args.host?.length ? args.host : 'localhost';
  const {
    projectRoot,
    server: {port},
    watchFolders,
  } = metroConfig;
  const protocol = args.https === true ? 'https' : 'http';
  const devServerUrl = url.format({protocol, hostname, port});

  logger.info(`Welcome to React Native v${ctx.reactNativeVersion}`);

  const serverStatus = await isDevServerRunning(devServerUrl, projectRoot);

  if (serverStatus === 'matched_server_running') {
    logger.info(
      `A dev server is already running for this project on port ${port}. Exiting.`,
    );
    return;
  } else if (serverStatus === 'port_taken') {
    logger.error(
      `Another process is running on port ${port}. Please terminate this ` +
        'process and try again, or use another port with "--port".',
    );
    return;
  }

  logger.info(`Starting dev server on port ${chalk.bold(String(port))}...`);

  if (args.assetPlugins) {
    // $FlowIgnore[cannot-write] Assigning to readonly property
    metroConfig.transformer.assetPlugins = args.assetPlugins.map(plugin =>
      require.resolve(plugin),
    );
  }

  const {
    middleware: communityMiddleware,
    websocketEndpoints: communityWebsocketEndpoints,
    messageSocketEndpoint,
    eventsSocketEndpoint,
  } = createDevServerMiddleware({
    host: hostname,
    port,
    watchFolders,
  });
  const {middleware, websocketEndpoints} = createDevMiddleware({
    projectRoot,
    serverBaseUrl: devServerUrl,
    logger,
    unstable_experiments: {
      // NOTE: Only affects the /open-debugger endpoint
      enableNewDebugger: args.experimentalDebugger,
    },
  });

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
      if (args.interactive && event.type === 'initialize_done') {
        logger.info('Dev server ready');
        attachKeyHandlers({
          cliConfig: ctx,
          devServerUrl,
          messageSocket: messageSocketEndpoint,
          experimentalDebuggerFrontend: args.experimentalDebugger,
        });
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
    unstable_extraMiddleware: [
      communityMiddleware,
      indexPageMiddleware,
      middleware,
    ],
    websocketEndpoints: {
      ...communityWebsocketEndpoints,
      ...websocketEndpoints,
    },
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
