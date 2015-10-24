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
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const parseCommandLine = require('../../../packager/parseCommandLine');
const isPackagerRunning = require('../util/isPackagerRunning');
const Promise = require('promise');

/**
 * Starts the app on a connected Android emulator or device.
 */
function runAndroid(argv, config) {
  return new Promise((resolve, reject) => {
    _runAndroid(argv, config, resolve, reject);
  });
}

function _runAndroid(argv, config, resolve, reject) {
  const args = parseCommandLine([{
    command: 'install-debug',
    type: 'string',
    required: false,
  }], argv);

  if (!checkAndroid()) {
    console.log(chalk.red('Android project not found. Maybe run react-native android first?'));
    return;
  }

  resolve(isPackagerRunning().then(result => {
    if (result === 'running') {
      console.log(chalk.bold('JS server already running.'));
    } else if (result === 'unrecognized') {
      console.warn(chalk.yellow('JS server not recognized, continuing with build...'));
    } else {
      // result == 'not_running'
      console.log(chalk.bold('Starting JS server...'));
      startServerInNewWindow();
    }
    buildAndRun(args, reject);
  }));
}

// Verifies this is an Android project
function checkAndroid() {
  return fs.existsSync('android/gradlew');
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args, reject) {
  process.chdir('android');
  try {
    const cmd = process.platform.startsWith('win')
      ? 'gradlew.bat'
      : './gradlew';

    const gradleArgs = ['installDebug'];
    if (args['install-debug']) {
      gradleArgs.push(args['install-debug']);
    }

    console.log(chalk.bold(
      'Building and installing the app on the device (cd android && ' + cmd +
      ' ' + gradleArgs.join(' ') + ')...'
    ));

    child_process.execFileSync(cmd, gradleArgs, {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(chalk.red(
      'Could not install the app on the device, see the error above.'
    ));
    // stderr is automatically piped from the gradle process, so the user
    // should see the error already, there is no need to do
    // `console.log(e.stderr)`
    reject();
    return;
  }

  try {
    const packageName = fs.readFileSync(
      'app/src/main/AndroidManifest.xml',
      'utf8'
    ).match(/package="(.+?)"/)[1];

    const adbPath = process.env.ANDROID_HOME
      ? process.env.ANDROID_HOME + '/platform-tools/adb'
      : 'adb';

    const adbArgs = [
      'shell', 'am', 'start', '-n', packageName + '/.MainActivity'
    ];

    console.log(chalk.bold(
      'Starting the app (' + adbPath + ' ' + adbArgs.join(' ') + ')...'
    ));

    child_process.spawnSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (e) {
    console.log(chalk.red(
      'adb invocation failed. Do you have adb in your PATH?'
    ));
    // stderr is automatically piped from the gradle process, so the user
    // should see the error already, there is no need to do
    // `console.log(e.stderr)`
    reject();
    return;
  }
}

function startServerInNewWindow() {
  const launchPackagerScript = path.resolve(
    __dirname, '..', '..', '..', 'packager', 'launchPackager.command'
  );

  if (process.platform === 'darwin') {
    child_process.spawnSync('open', [launchPackagerScript]);
  } else if (process.platform === 'linux') {
    child_process.spawn(
      'xterm',
      ['-e', 'sh', launchPackagerScript],
      {detached: true}
    );
  } else if (/^win/.test(process.platform)) {
    console.log(chalk.yellow('Starting the packager in a new window ' +
      'is not supported on Windows yet.\nPlease start it manually using ' +
      '\'react-native start\'.'));
    console.log('We believe the best Windows ' +
      'support will come from a community of people\nusing React Native on ' +
      'Windows on a daily basis.\n' +
      'Would you be up for sending a pull request?');
  } else {
    console.log(chalk.red('Cannot start the packager. Unknown platform ' +
      process.platform));
  }
}

module.exports = runAndroid;
