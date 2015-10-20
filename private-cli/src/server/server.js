/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const checkNodeVersion = require('./checkNodeVersion');
const formatBanner = require('./formatBanner');
const parseCommandLine = require('../../../packager/parseCommandLine');
const path = require('path');
const Promise = require('promise');
const runServer = require('./runServer');
const webSocketProxy = require('../../../packager/webSocketProxy.js');

/**
 * Starts the React Native Packager Server.
 */
function server(argv, config) {
  return new Promise((resolve, reject) => {
    _server(argv, config, resolve, reject);
  });
}

function _server(argv, config, resolve, reject) {
  const args = parseCommandLine([{
    command: 'port',
    default: 8081,
    type: 'string',
  }, {
    command: 'root',
    type: 'string',
    description: 'add another root(s) to be used by the packager in this project',
  }, {
    command: 'assetRoots',
    type: 'string',
    description: 'specify the root directories of app assets'
  }, {
    command: 'skipflow',
    description: 'Disable flow checks'
  }, {
    command: 'nonPersistent',
    description: 'Disable file watcher'
  }, {
    command: 'transformer',
    type: 'string',
    default: require.resolve('../../../packager/transformer'),
    description: 'Specify a custom transformer to be used (absolute path)'
  }, {
    command: 'resetCache',
    description: 'Removes cached files',
    default: false,
  }, {
    command: 'reset-cache',
    description: 'Removes cached files',
    default: false,
  }, {
    command: 'verbose',
    description: 'Enables logging',
    default: false,
  }]);

  args.projectRoots = args.projectRoots
    ? argToArray(args.projectRoots)
    : config.getProjectRoots();

  if (args.root) {
    const additionalRoots = argToArray(args.root);
    additionalRoots.forEach(root => {
      args.projectRoots.push(path.resolve(root));
    });
  }

  args.assetRoots = args.assetRoots
    ? argToArray(args.projectRoots).map(dir =>
      path.resolve(process.cwd(), dir)
    )
    : config.getAssetRoots();

  checkNodeVersion();

  console.log(formatBanner(
    'Running packager on port ' + args.port + '.\n\n' +
    'Keep this packager running while developing on any JS projects. ' +
    'Feel free to close this tab and run your own packager instance if you ' +
    'prefer.\n\n' +
    'https://github.com/facebook/react-native', {
      marginLeft: 1,
      marginRight: 1,
      paddingBottom: 1,
    })
  );

  console.log(
    'Looking for JS files in\n  ',
    chalk.dim(args.projectRoots.join('\n   ')),
    '\n'
  );

  process.on('uncaughtException', error => {
    if (error.code === 'EADDRINUSE') {
      console.log(
        chalk.bgRed.bold(' ERROR '),
        chalk.red('Packager can\'t listen on port', chalk.bold(args.port))
      );
      console.log('Most likely another process is already using this port');
      console.log('Run the following command to find out which process:');
      console.log('\n  ', chalk.bold('lsof -n -i4TCP:' + args.port), '\n');
      console.log('You can either shut down the other process:');
      console.log('\n  ', chalk.bold('kill -9 <PID>'), '\n');
      console.log('or run packager on different port.');
    } else {
      console.log(chalk.bgRed.bold(' ERROR '), chalk.red(error.message));
      const errorAttributes = JSON.stringify(error);
      if (errorAttributes !== '{}') {
        console.error(chalk.red(errorAttributes));
      }
      console.error(chalk.red(error.stack));
    }
    console.log('\nSee', chalk.underline('http://facebook.github.io/react-native/docs/troubleshooting.html'));
    console.log('for common problems and solutions.');
    reject();
  });

  // TODO: remove once we deprecate this arg
  if (args.resetCache) {
    console.log(
      'Please start using `--reset-cache` instead. ' +
      'We\'ll deprecate this argument soon.'
    );
  }

  startServer(args, config);
}

function startServer(args, config) {
  const serverInstance = runServer(args, config, () =>
    console.log('\nReact packager ready.\n')
  );

  webSocketProxy.attachToServer(serverInstance, '/debugger-proxy');
  webSocketProxy.attachToServer(serverInstance, '/devtools');
}

function argToArray(arg) {
  return Array.isArray(arg) ? arg : arg.split(',');
}

module.exports = server;
