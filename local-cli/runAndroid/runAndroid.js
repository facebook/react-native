/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const adb = require('./adb');
const chalk = require('chalk');
const child_process = require('child_process');
const fs = require('fs');
const isPackagerRunning = require('../util/isPackagerRunning');
const isString = require('lodash/isString');
const path = require('path');
const Promise = require('promise');

// Verifies this is an Android project
function checkAndroid(root) {
  return fs.existsSync(path.join(root, 'android/gradlew'));
}

/**
 * Starts the app on a connected Android emulator or device.
 */
function runAndroid(argv, config, args) {
  if (!checkAndroid(args.root)) {
    console.log(chalk.red('Android project not found. Maybe run react-native android first?'));
    return;
  }

  if (!args.packager) {
    return buildAndRun(args);
  }

  return isPackagerRunning().then(result => {
    if (result === 'running') {
      console.log(chalk.bold('JS server already running.'));
    } else if (result === 'unrecognized') {
      console.warn(chalk.yellow('JS server not recognized, continuing with build...'));
    } else {
      // result == 'not_running'
      console.log(chalk.bold('Starting JS server...'));
      startServerInNewWindow();
    }
    return buildAndRun(args);
  });
}

function getAdbPath() {
  return process.env.ANDROID_HOME
    ? process.env.ANDROID_HOME + '/platform-tools/adb'
    : 'adb';
}

// Runs ADB reverse tcp:8081 tcp:8081 to allow loading the jsbundle from the packager
function tryRunAdbReverse(device) {
  try {
    const adbPath = getAdbPath();
    const adbArgs = ['reverse', 'tcp:8081', 'tcp:8081'];

    // If a device is specified then tell adb to use it
    if (device) {
      adbArgs.unshift('-s', device);
    }

    console.log(chalk.bold(
      `Running ${adbPath} ${adbArgs.join(' ')}`
    ));

    child_process.execFileSync(adbPath, adbArgs, {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(chalk.yellow(`Could not run adb reverse: ${e.message}`));
  }
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args) {
  process.chdir(path.join(args.root, 'android'));
  const cmd = process.platform.startsWith('win')
    ? 'gradlew.bat'
    : './gradlew';

  const packageName = fs.readFileSync(
      'app/src/main/AndroidManifest.xml',
      'utf8'
    ).match(/package="(.+?)"/)[1];

  runOnDevices(args, cmd, packageName, getAdbPath());
}

function tryInstallAppOnDevice(args, device) {
  var variant = '';

  // Flavor is deprecated, but we keep the support.
  if (args.flavor) {
    variant = `-${args.variant}`;
  }

  if (args.variant) {
    variant = `-${args.variant}`;
  }

  try {
    const pathToApk = `app/build/outputs/apk/app${variant}-${args.configuration.toLowerCase()}.apk`;
    const adbPath = getAdbPath();
    const adbArgs = ['-s', device, 'install', '-r', pathToApk];
    console.log(chalk.bold(
      `Installing the app on the device (cd android && adb -s ${device} install ${pathToApk}`
    ));
    child_process.execFileSync(adbPath, adbArgs, {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(e.message);
    console.log(chalk.red(
      'Could not install the app on the device, read the error above for details.\n'
    ));
  }
}

function tryLaunchAppOnDevice(device, packageName, adbPath, mainActivity) {
  try {
    const adbArgs = ['-s', device, 'shell', 'am', 'start', '-n', packageName + '/.' + mainActivity];
    console.log(chalk.bold(
      `Starting the app on ${device} (${adbPath} ${adbArgs.join(' ')})...`
    ));
    child_process.spawnSync(adbPath, adbArgs, {stdio: 'inherit'});
  } catch (e) {
    console.log(chalk.red(
      'adb invocation failed. Do you have adb in your PATH?'
    ));
  }
}

function runOnDevices(args, cmd, packageName, adbPath){
  try {
    const gradleArgs = [];

    if (args.variant) {
      gradleArgs.push('assemble' +
        args.variant[0].toUpperCase() + args.variant.slice(1)
      );
    } else if (args.flavor) {
      console.warn(chalk.yellow(
        '--flavor has been deprecated. Use --variant instead'
      ));
      gradleArgs.push('assemble' +
        args.flavor[0].toUpperCase() + args.flavor.slice(1)
      );
    } else {
      gradleArgs.push('assemble');
    }

    // Append the build type to the current gradle install configuration.
    // By default it will generate `installDebug`.
    gradleArgs[0] = gradleArgs[0] + args.configuration[0].toUpperCase() + args.configuration.slice(1);

    // Get the gradle binary for the current platform.
    const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

    if (args.configuration.toUpperCase() === 'RELEASE') {
      console.log(chalk.bold(
        'Generating the bundle for the release build...'
      ));

      // Generate the release files.
      child_process.execSync(
        'react-native bundle ' +
        '--platform android ' +
        '--dev false ' +
        '--entry-file index.android.js ' +
        `--bundle-output app/src/main/assets/index.android.bundle ` +
        `--assets-dest app/src/main/res/`,
        {
          stdio: [process.stdin, process.stdout, process.stderr],
        }
      );
    }

    console.log(chalk.bold(
      `Building and installing the app on the device (cd android && ${cmd} ${gradleArgs.join(' ')})...`
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
    return Promise.reject();
  }

  // Check if it is to launch only on a specific device.
  if (args.deviceId) {
    if (isString(args.deviceId)) {
      tryRunAdbReverse(args.deviceId);
      tryInstallAppOnDevice(args, args.deviceId);
      tryLaunchAppOnDevice(args.deviceId, packageName, adbPath, args.mainActivity);
    } else {
      console.log(chalk.red('Argument missing for parameter --deviceId'));
    }

    return;
  }

  // Launch the app on all the devices connected.
  const devices = adb.getDevices();
  if (devices && devices.length > 0) {
    devices.forEach((device) => {
      tryRunAdbReverse(device);
      tryInstallAppOnDevice(args, device);
      tryLaunchAppOnDevice(device, packageName, adbPath, args.mainActivity);
    });
  } else {
    try {
      // If we cannot execute based on adb devices output, fall back to
      // shell am start
      const fallbackAdbArgs = [
        'shell', 'am', 'start', '-n', packageName + '/.MainActivity'
      ];
      console.log(chalk.bold(
        `Starting the app (${adbPath} ${fallbackAdbArgs.join(' ')}...`
      ));
      child_process.spawnSync(adbPath, fallbackAdbArgs, {stdio: 'inherit'});
    } catch (e) {
      console.log(chalk.red(
        'adb invocation failed. Do you have adb in your PATH?'
      ));
      // stderr is automatically piped from the gradle process, so the user
      // should see the error already, there is no need to do
      // `console.log(e.stderr)`
      return Promise.reject();
    }
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

module.exports = {
  name: 'run-android',
  description: 'builds your app and starts it on a connected Android emulator or device',
  func: runAndroid,
  options: [ {
    command: '--configuration [string]',
    description:
      'You can use `Release` or `Debug`. ' +
      'This creates a build based on the selected configuration. ' +
      'If you want to use the `Release` configuration make sure you have the ' +
      '`signingConfig` configured at `app/build.gradle`.',
    default: 'Debug'
  }, {
    command: '--root [string]',
    description: 'Override the root directory for the android build (which contains the android directory)',
    default: '',
  }, {
    command: '--flavor [string]',
    description: '--flavor has been deprecated. Use --variant instead',
  }, {
    command: '--variant [string]',
    description: 'The variant you want to generate. For instance: sandbox, production...',
  }, {
    command: '--main-activity [string]',
    description: 'Name of the activity to start',
    default: 'MainActivity',
  }, {
    command: '--deviceId [string]',
    description: 'builds your app and starts it on a specific device/simulator with the ' +
      'given device id (listed by running "adb devices" on the command line).',
  }, {
    command: '--no-packager',
    description: 'Do not launch packager while building',
  }],
};
