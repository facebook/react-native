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
const parseCommandLine = require('../util/parseCommandLine');
const isPackagerRunning = require('../util/isPackagerRunning');
const Promise = require('promise');
const adb = require('./adb');

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
  }, {
    command: 'root',
    type: 'string',
    description: 'Override the root directory for the android build (which contains the android directory)',
  }, {
    command: 'flavor',
    type: 'string',
    required: false,
  }, {
    command: 'variant',
    type: 'string',
    required: false,
  }], argv);

  args.root = args.root || '';

  if (!checkAndroid(args)) {
    console.log(chalk.red('Android project not found. Maybe run react-native android first?'));
    return;
  }

  resolve(isPackagerRunning().then(result => {
    if (result === 'running') {
      console.log(chalk.bold(`JS server already running.`));
    } else if (result === 'unrecognized') {
      console.warn(chalk.yellow(`JS server not recognized, continuing with build...`));
    } else {
      // result == 'not_running'
      console.log(chalk.bold(`Starting JS server...`));
      startServerInNewWindow();
    }
    run(args, reject);
  }));
}

// Verifies this is an Android project
function checkAndroid(args) {
  return fs.existsSync(path.join(args.root, 'android/gradlew'));
}

function getAdbPath() {
  return process.env.ANDROID_HOME
    ? process.env.ANDROID_HOME + '/platform-tools/adb'
    : 'adb';
}

// Runs ADB reverse tcp:8081 tcp:8081 to allow loading the jsbundle from the packager
function tryRunAdbReverse() {
  try {
    const adbPath = getAdbPath();
    const adbArgs = ['reverse', 'tcp:8081', 'tcp:8081'];

    console.log(chalk.bold(
      `Running ${adbPath} ${adbArgs.join(' ')}`
    ));

    child_process.execFileSync(adbPath, adbArgs, {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch(e) {
    console.log(chalk.yellow(
      `Could not run adb reverse: ${e.message}`
    ));
  }
}

// Builds the app and runs it on a connected emulator / device.
function run(args, reject) {
  process.chdir(path.join(args.root, 'android'));
  try {
    tryRunAdbReverse();

    const cmd = process.platform.startsWith('win')
      ? 'gradlew.bat'
      : './gradlew';

    const gradleArgs = [];
    if (args['variant']) {
        gradleArgs.push('install' +
          args['variant'][0].toUpperCase() + args['variant'].slice(1)
        );
    } else if (args['flavor']) {
        console.warn(chalk.yellow(
          `--flavor has been deprecated. Use --variant instead`
        ));
        gradleArgs.push('install' +
          args['flavor'][0].toUpperCase() + args['flavor'].slice(1)
        );
    } else {
        gradleArgs.push('installDebug');
    }

    if (args['install-debug']) {
      gradleArgs.push(args['install-debug']);
    }

    console.log(chalk.bold(
      `Building and installing the app on the device (cd android && ${cmd} ${gradleArgs.join(' ')}...`
    ));

    child_process.execFileSync(cmd, gradleArgs, {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(chalk.red(
      'Could not install the app on the device, read the error above for details.\n' +
      'Make sure you have an Android emulator running or a device connected and have\n' +
      'set up your Android development environment:\n' +
      'https://facebook.github.io/react-native/docs/android-setup.html'
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

    const adbPath = getAdbPath();

    const devices = adb.getDevices();

    if (devices && devices.length > 0) {
      devices.forEach((device) => {

        const adbArgs = ['-s', device, 'shell', 'am', 'start', '-n', packageName + '/.MainActivity'];

        console.log(chalk.bold(
          `Starting the app on ${device} (${adbPath} ${adbArgs.join(' ')})...`
        ));

        child_process.spawnSync(adbPath, adbArgs, {stdio: 'inherit'});
      });
    } else {
      // If we cannot execute based on adb devices output, fall back to
      // shell am start
      const fallbackAdbArgs = [
        'shell', 'am', 'start', '-n', packageName + '/.MainActivity'
      ];
      console.log(chalk.bold(
        `Starting the app (${adbPath} ${fallbackAdbArgs.join(' ')}...`
      ));
      child_process.spawnSync(adbPath, fallbackAdbArgs, {stdio: 'inherit'});
    }

  } catch (e) {
    console.log(chalk.red(
      `adb invocation failed. Do you have adb in your PATH?`
    ));
    // stderr is automatically piped from the gradle process, so the user
    // should see the error already, there is no need to do
    // `console.log(e.stderr)`
    reject();
    return;
  }
}

function startServerInNewWindow() {
  const yargV = require('yargs').argv;
  const scriptFile = /^win/.test(process.platform) ?
    'launchPackager.bat' :
    'launchPackager.command';
  const packagerDir = path.resolve(__dirname, '..', '..', 'packager');
  const launchPackagerScript = path.resolve(packagerDir, scriptFile);
  const procConfig = {cwd: packagerDir};

  if (process.platform === 'darwin') {
    if (yargV.open) {
      return child_process.spawnSync('open', ['-a', yargV.open, launchPackagerScript], procConfig);
    }
    return child_process.spawnSync('open', [launchPackagerScript], procConfig);

  } else if (process.platform === 'linux') {
    procConfig.detached = true;
    if (yargV.open){
      return child_process.spawn(yargV.open,['-e', 'sh', launchPackagerScript], procConfig);
    }
    return child_process.spawn('sh', [launchPackagerScript], procConfig);

  } else if (/^win/.test(process.platform)) {
    procConfig.detached = true;
    procConfig.stdio = 'ignore';
    return child_process.spawn('cmd.exe', ['/C', 'start', launchPackagerScript], procConfig);
  } else {
    console.log(chalk.red(`Cannot start the packager. Unknown platform ${process.platform}`));
  }
}

module.exports = runAndroid;
