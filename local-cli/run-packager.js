/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var chalk = require('chalk');
var path = require('path');
var child_process = require('child_process');

/**
 * Main entry point to starting the packager from JS.
 * @param {boolean} newWindow If true, will start the packager in a new shell window.
 */
module.exports = function(newWindow) {
  if (newWindow) {
    var launchPackagerScript =
      path.resolve(__dirname, '..', 'packager', 'launchPackager.command');
    if (process.platform === 'darwin') {
      child_process.spawnSync('open', [launchPackagerScript]);
    } else if (process.platform === 'linux') {
      child_process.spawn(
        'xterm',
        ['-e', 'sh', launchPackagerScript],
        {detached: true});
    } else if (/^win/.test(process.platform)) {
      console.log(chalk.yellow('Starting the packager in a new window ' +
        'is not supported on Windows yet.\nPlease start it manually using ' +
        '\'react-native start\'.'));
      console.log('We believe the best Windows ' +
        'support will come from a community of people\nusing React Native on ' +
        'Windows on a daily basis.\n' +
        'Would you be up for sending a pull request?');
    } else {
      console.log('Cannot start the packager. Unknown platform ' + process.platform);
    }
  } else {
    if (/^win/.test(process.platform)) {
      child_process.spawn('node', [
          path.resolve(__dirname, '..', 'packager', 'packager.js'),
          '--projectRoots',
          process.cwd(),
        ], {stdio: 'inherit'});
    } else {
      child_process.spawn('sh', [
          path.resolve(__dirname, '..', 'packager', 'packager.sh'),
          '--projectRoots',
          process.cwd(),
        ], {stdio: 'inherit'});
    }
  }
};
