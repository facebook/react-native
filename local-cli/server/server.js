/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const runServer = require('./runServer');

import type {RNConfig} from '../core';
import type {ConfigT} from 'metro-config/src/configTypes.flow';
import type {Args as RunServerArgs} from './runServer';

/**
 * Starts the React Native Packager Server.
 */
function server(argv: mixed, config: RNConfig, args: RunServerArgs) {
  /* $FlowFixMe(site=react_native_fb) ConfigT shouldn't be extendable. */
  const configT: ConfigT = config;
  runServer(args, configT);
}

module.exports = {
  name: 'start',
  func: server,
  description: 'starts the webserver',
  options: [
    {
      command: '--port [number]',
      parse: (val: string) => Number(val),
      default: (config: ConfigT) => config.server.port,
    },
    {
      command: '--host [string]',
      default: '',
    },
    {
      command: '--projectRoot [string]',
      description: 'Specify the main project root',
      default: (config: ConfigT) => config.projectRoot,
    },
    {
      command: '--watchFolders [list]',
      description:
        'Specify any additional folders to be added to the watch list',
      parse: (val: string) => val.split(','),
      default: (config: ConfigT) => config.watchFolders,
    },
    {
      command: '--assetExts [list]',
      description:
        'Specify any additional asset extensions to be used by the packager',
      parse: (val: string) => val.split(','),
      default: (config: ConfigT) => config.resolver.assetExts,
    },
    {
      command: '--sourceExts [list]',
      description:
        'Specify any additional source extensions to be used by the packager',
      parse: (val: string) => val.split(','),
      default: (config: ConfigT) => config.resolver.sourceExts,
    },
    {
      command: '--platforms [list]',
      description:
        'Specify any additional platforms to be used by the packager',
      parse: (val: string) => val.split(','),
      default: (config: ConfigT) => config.resolver.platforms,
    },
    {
      command: '--providesModuleNodeModules [list]',
      description:
        'Specify any npm packages that import dependencies with providesModule',
      parse: (val: string) => val.split(','),
      default: (config: ConfigT) => config.resolver.providesModuleNodeModules,
    },
    {
      command: '--max-workers [number]',
      description:
        'Specifies the maximum number of workers the worker-pool ' +
        'will spawn for transforming files. This defaults to the number of the ' +
        'cores available on your machine.',
      default: (config: ConfigT) => config.maxWorkers,
      parse: (workers: string) => Number(workers),
    },
    {
      command: '--skipflow',
      description: 'Disable flow checks',
    },
    {
      command: '--nonPersistent',
      description: 'Disable file watcher',
    },
    {
      command: '--transformer [string]',
      description: 'Specify a custom transformer to be used',
    },
    {
      command: '--reset-cache, --resetCache',
      description: 'Removes cached files',
    },
    {
      command: '--custom-log-reporter-path, --customLogReporterPath [string]',
      description:
        'Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter',
    },
    {
      command: '--verbose',
      description: 'Enables logging',
    },
    {
      command: '--https',
      description: 'Enables https connections to the server',
    },
    {
      command: '--key [path]',
      description: 'Path to custom SSL key',
    },
    {
      command: '--cert [path]',
      description: 'Path to custom SSL cert',
    },
  ],
};
