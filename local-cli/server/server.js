/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');
const runServer = require('./runServer');

/**
 * Starts the React Native Packager Server.
 */
function server(argv, config, args) {
  args.projectRoots = args.projectRoots.concat(args.root);

  const startedCallback = logReporter => {
    logReporter.update({
      type: 'initialize_packager_started',
      port: args.port,
      projectRoots: args.projectRoots,
    });

    process.on('uncaughtException', error => {
      logReporter.update({
        type: 'initialize_packager_failed',
        port: args.port,
        error,
      });

      process.exit(11);
    });
  };

  const readyCallback = logReporter => {
    logReporter.update({
      type: 'initialize_packager_done',
    });
  };

  runServer(args, config, startedCallback, readyCallback);
}

module.exports = {
  name: 'start',
  func: server,
  description: 'starts the webserver',
  options: [{
    command: '--port [number]',
    default: 8081,
    parse: (val) => Number(val),
  }, {
    command: '--host [string]',
    default: '',
  }, {
    command: '--root [list]',
    description: 'add another root(s) to be used by the packager in this project',
    parse: (val) => val.split(',').map(root => path.resolve(root)),
    default: [],
  }, {
    command: '--projectRoots [list]',
    description: 'override the root(s) to be used by the packager',
    parse: (val) => val.split(','),
    default: (config) => config.getProjectRoots(),
  }, {
    command: '--assetExts [list]',
    description: 'Specify any additional asset extentions to be used by the packager',
    parse: (val) => val.split(','),
    default: (config) => config.getAssetExts(),
  }, {
    command: '--platforms [list]',
    description: 'Specify any additional platforms to be used by the packager',
    parse: (val) => val.split(','),
    default: (config) => config.getPlatforms(),
  }, {
    command: '--providesModuleNodeModules [list]',
    description: 'Specify any npm packages that import dependencies with providesModule',
    parse: (val) => val.split(','),
    default: (config) => {
      if (typeof config.getProvidesModuleNodeModules === 'function') {
        return config.getProvidesModuleNodeModules();
      }
      return null;
    },
  }, {
    command: '--skipflow',
    description: 'Disable flow checks'
  }, {
    command: '--nonPersistent',
    description: 'Disable file watcher'
  }, {
    command: '--transformer [string]',
    description: 'Specify a custom transformer to be used'
  }, {
    command: '--reset-cache, --resetCache',
    description: 'Removes cached files',
  }, {
    command: '--custom-log-reporter-path, --customLogReporterPath [string]',
    description: 'Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter',
  }, {
    command: '--verbose',
    description: 'Enables logging',
  }],
};
