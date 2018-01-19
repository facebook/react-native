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
const findReactNativeScripts = require('../util/findReactNativeScripts');
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
    const reactNativeScriptsPath = findReactNativeScripts();
    if (reactNativeScriptsPath) {
      child_process.spawnSync(
        reactNativeScriptsPath,
        ['android'].concat(process.argv.slice(1)),
        {stdio: 'inherit'}
      );
    } else {
      console.log(chalk.red('Android project not found. Maybe run react-native android first?'));
    }
    return;
  }

  if (!args.packager) {
    return buildAndRun(args);
  }

  return isPackagerRunning(args.port).then(result => {
    if (result === 'running') {
      console.log(chalk.bold('JS server already running.'));
    } else if (result === 'unrecognized') {
      console.warn(chalk.yellow('JS server not recognized, continuing with build...'));
    } else {
      // result == 'not_running'
      console.log(chalk.bold('Starting JS server...'));
      startServerInNewWindow(args.port);
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
function tryRunAdbReverse(packagerPort, device) {
  try {
    const adbPath = getAdbPath();
    const adbArgs = ['reverse', `tcp:${packagerPort}`, `tcp:${packagerPort}`];

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

function getPackageNameWithSuffix(appId, appIdSuffix, packageName) {
  if (appId) {
    return appId;
  } else if (appIdSuffix) {
    return packageName + '.' + appIdSuffix;
  }

  return packageName;
}

// Builds the app and runs it on a connected emulator / device.
function buildAndRun(args) {
  process.chdir(path.join(args.root, 'android'));
  const cmd = process.platform.startsWith('win')
    ? 'gradlew.bat'
    : './gradlew';

  const packageName = fs.readFileSync(
      `${args.appFolder}/src/main/AndroidManifest.xml`,
      'utf8'
    ).match(/package="(.+?)"/)[1];

  const packageNameWithSuffix = getPackageNameWithSuffix(args.appId, args.appIdSuffix, packageName);

  const adbPath = getAdbPath();
  if (args.deviceId) {
    if (isString(args.deviceId)) {
        runOnSpecificDevice(args, cmd, packageNameWithSuffix, packageName, adbPath);
    } else {
      console.log(chalk.red('Argument missing for parameter --deviceId'));
    }
  } else {
    runOnAllDevices(args, cmd, packageNameWithSuffix, packageName, adbPath);
  }
}

function runOnSpecificDevice(args, gradlew, packageNameWithSuffix, packageName, adbPath) {
  let devices = adb.getDevices();
  if (devices && devices.length > 0) {
    if (devices.indexOf(args.deviceId) !== -1) {
      buildApk(gradlew);
      installAndLaunchOnDevice(args, args.deviceId, packageNameWithSuffix, packageName, adbPath);
    } else {
      console.log('Could not find device with the id: "' + args.deviceId + '".');
      console.log('Choose one of the following:');
      console.log(devices);
    }
  } else {
    console.log('No Android devices connected.');
  }
}

function buildApk(gradlew) {
  try {
    console.log(chalk.bold('Building the app...'));

    // using '-x lint' in order to ignore linting errors while building the apk
    child_process.execFileSync(gradlew, ['build', '-x', 'lint'], {
      stdio: [process.stdin, process.stdout, process.stderr],
    });
  } catch (e) {
    console.log(chalk.red('Could not build the app, read the error above for details.\n'));
  }
}

function tryInstallAppOnDevice(args, device) {
  try {
    const pathToApk = `${args.appFolder}/build/outputs/apk/${args.appFolder}-debug.apk`;
    const adbPath = getAdbPath();
    const adbArgs = ['-s', device, 'install', pathToApk];
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

function tryLaunchAppOnDevice(device, packageNameWithSuffix, packageName, adbPath, mainActivity) {
  try {
    const adbArgs = ['-s', device, 'shell', 'am', 'start', '-n', packageNameWithSuffix + '/' + packageName + '.' + mainActivity];
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

function installAndLaunchOnDevice(args, selectedDevice, packageNameWithSuffix, packageName, adbPath) {
  tryRunAdbReverse(args.port, selectedDevice);
  tryInstallAppOnDevice(args, selectedDevice);
  tryLaunchAppOnDevice(selectedDevice, packageNameWithSuffix, packageName, adbPath, args.mainActivity);
}

function runOnAllDevices(args, cmd, packageNameWithSuffix, packageName, adbPath){
  try {
    const gradleArgs = [];
    if (args.variant) {
      gradleArgs.push('install' +
        args.variant[0].toUpperCase() + args.variant.slice(1)
      );
    } else if (args.flavor) {
      console.warn(chalk.yellow(
        '--flavor has been deprecated. Use --variant instead'
      ));
      gradleArgs.push('install' +
        args.flavor[0].toUpperCase() + args.flavor.slice(1)
      );
    } else {
      gradleArgs.push('installDebug');
    }

    if (args.installDebug) {
      gradleArgs.push(args.installDebug);
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
      'https://facebook.github.io/react-native/docs/getting-started.html'
    ));
    // stderr is automatically piped from the gradle process, so the user
    // should see the error already, there is no need to do
    // `console.log(e.stderr)`
    return Promise.reject();
  }
    const devices = adb.getDevices();
    if (devices && devices.length > 0) {
      devices.forEach((device) => {
        tryRunAdbReverse(args.port, device);
        tryLaunchAppOnDevice(device, packageNameWithSuffix, packageName, adbPath, args.mainActivity);
      });
    } else {
      try {
        // If we cannot execute based on adb devices output, fall back to
        // shell am start
        const fallbackAdbArgs = [
          'shell', 'am', 'start', '-n', packageNameWithSuffix + '/' + packageName + '.MainActivity'
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

function startServerInNewWindow(port) {
  const scriptFile = /^win/.test(process.platform) ?
    'launchPackager.bat' :
    'launchPackager.command';
  const scriptsDir = path.resolve(__dirname, '..', '..', 'scripts');
  const launchPackagerScript = path.resolve(scriptsDir, scriptFile);
  const procConfig = {cwd: scriptsDir};
  const terminal = process.env.REACT_TERMINAL;

  // setup the .packager.env file to ensure the packager starts on the right port
  const packagerEnvFile = path.join(__dirname, '..', '..', 'scripts', '.packager.env');
  const content = `export RCT_METRO_PORT=${port}`;
  // ensure we overwrite file by passing the 'w' flag
  fs.writeFileSync(packagerEnvFile, content, {encoding: 'utf8', flag: 'w'});

  if (process.platform === 'darwin') {
    if (terminal) {
      return child_process.spawnSync('open', ['-a', terminal, launchPackagerScript], procConfig);
    }
    return child_process.spawnSync('open', [launchPackagerScript], procConfig);

  } else if (process.platform === 'linux') {
    procConfig.detached = true;
    if (terminal){
      return child_process.spawn(terminal, ['-e', 'sh ' + launchPackagerScript], procConfig);
    }
    return child_process.spawn('sh', [launchPackagerScript], procConfig);

  } else if (/^win/.test(process.platform)) {
    procConfig.detached = true;
    procConfig.stdio = 'ignore';
    return child_process.spawn('cmd.exe', ['/C', launchPackagerScript], procConfig);
  } else {
    console.log(chalk.red(`Cannot start the packager. Unknown platform ${process.platform}`));
  }
}

module.exports = {
  name: 'run-android',
  description: 'builds your app and starts it on a connected Android emulator or device',
  func: runAndroid,
  options: [{
    command: '--install-debug',
  }, {
    command: '--root [string]',
    description: 'Override the root directory for the android build (which contains the android directory)',
    default: '',
  }, {
    command: '--flavor [string]',
    description: '--flavor has been deprecated. Use --variant instead',
  }, {
    command: '--variant [string]',
  }, {
    command: '--appFolder [string]',
    description: 'Specify a different application folder name for the android source.',
    default: 'app',
  }, {
    command: '--appId [string]',
    description: 'Specify an applicationId to launch after build.',
    default: '',
  }, {
    command: '--appIdSuffix [string]',
    description: 'Specify an applicationIdSuffix to launch after build.',
    default: '',
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
  }, {
    command: '--port [number]',
    default: process.env.RCT_METRO_PORT || 8081,
    parse: (val: string) => Number(val),
  }],
};
