#!/usr/bin/env node

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const isWindows = process.platform === 'win32';

var installedGlobally;
if (isWindows) {
  const fs = require('fs');
  const path = require('path');
  // On Windows, assume we are installed globally if we can't find a package.json above node_modules.
  installedGlobally = !(fs.existsSync(path.join(__dirname, '../../../package.json')));
} else {
  // On non-windows, assume we are installed globally if we are called from outside of the node_mobules/.bin/react-native executable.
  var script = process.argv[1];
  installedGlobally = script.indexOf('node_modules/.bin/react-native') === -1;
}


if (installedGlobally) {
  const chalk = require('chalk');

  console.error([
    chalk.red('Looks like you installed react-native globally, maybe you meant react-native-cli?'),
    chalk.red('To fix the issue, run:'),
    'npm uninstall -g react-native',
    'npm install -g react-native-cli'
  ].join('\n'));
  process.exit(1);
} else {
  require('./cli').run();
}
