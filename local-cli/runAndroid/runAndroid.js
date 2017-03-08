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

  const adbPath = getAdbPath();
  if (args.deviceId) {
    if (isString(args.deviceId)) {
        runOnSpecificDevice(args, cmd, adbPath);
    } else {
      console.log(chalk.red('Argument missing for parameter --deviceId'));
    }
  } else {
    runOnAllDevices(args, cmd, adbPath);
  }
}

function runOnSpecificDevice(args, gradlew, adbPath) {
  let devices = adb.getDevices();
  if (devices && devices.length > 0) {
    if (devices.indexOf(args.deviceId) !== -1) {
      buildApk(gradlew);
      installAndLaunchOnDevice(args, args.deviceId, adbPath);
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
    const pathToApk = 'app/build/outputs/apk/app-debug.apk';
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

function tryLaunchAppOnDevice(args, device, adbPath) {
  try {
    const activityClass = getActivityClass(args);
    const adbArgs = ['-s', device, 'shell', 'am', 'start', '-n', activityClass];
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

function installAndLaunchOnDevice(args, selectedDevice, adbPath) {
  tryRunAdbReverse(selectedDevice);
  tryInstallAppOnDevice(args, selectedDevice);
  tryLaunchAppOnDevice(args, selectedDevice, adbPath);
}

function runOnAllDevices(args, cmd, adbPath){
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
      'https://facebook.github.io/react-native/docs/android-setup.html'
    ));
    // stderr is automatically piped from the gradle process, so the user
    // should see the error already, there is no need to do
    // `console.log(e.stderr)`
    return Promise.reject();
  }
    const devices = adb.getDevices();
    if (devices && devices.length > 0) {
      devices.forEach((device) => {
        tryRunAdbReverse(device);
        tryLaunchAppOnDevice(args, device,  adbPath);
      });
    } else {
      try {
        // If we cannot execute based on adb devices output, fall back to
        // shell am start

        const activityClass = getActivityClass(args);
        const fallbackAdbArgs = [
          'shell', 'am', 'start', '-n', activityClass
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

function findPreviousTerm(content, endPos) {
  while (content[endPos] === ' ') {
    --endPos;
  }
  const regex = new RegExp('\\w');
  const word = [];
  while (regex.exec(content[endPos])) {
    word.push(content[endPos]);
    --endPos;
  }
  return word.reverse().join('');
}

function findBuildTypes(filePath) {
  // Read the gradle file and get list of buildTypes defined for the project.
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp('buildType\\s+{', 'ig');
  const buildTypes = ['debug', 'release'];
  const match = regex.exec(content);
  if (!match) {
    return buildTypes;
  }
  const buildTypeStartPos = regex.lastIndex;
  let counter = 1;
  let pos = buildTypeStartPos + 1;
  while (counter > 0) {
    if (content[pos] === '{') {
      counter += 1;
      if (counter === 2) {
        const previousTerm = findPreviousTerm(content, pos - 1);
        if (buildTypes.indexOf(previousTerm) === -1) {
          buildTypes.push(previousTerm);
        }
      }
    } else if (content[pos] === '}') {
      --counter;
    }
    ++pos;
  }
  return buildTypes;
}

function splitVariant(gradleFilePath, variant) {
  // Split the variant into buildType and flavor
  const buildTypes = findBuildTypes(gradleFilePath, 'buildTypes', ['debug', 'release']);
  const regexp = new RegExp(buildTypes.join('|'), 'gi');
  const match = regexp.exec(variant);
  let flavor = null;
  let buildType = variant;
  if (match) {
    flavor = variant.substring(0, match.index);
    buildType = variant.substring(match.index);
  }
  return { buildType, flavor };
}

function isSeparateBuildEnabled(gradleFilePath) {
  // Check if separate build enabled for different processors
  const content = fs.readFileSync(gradleFilePath, 'utf8');
  const separateBuild = content.match(/enableSeparateBuildPerCPUArchitecture\s+=\s+([\w]+)/)[1];
  return separateBuild.toLowerCase() === 'true';
}

function getManifestFile(variant) {
  // get the path to the correct manifest file to find the correct package name to be used while
  // starting the app
  const gradleFilePath = 'app/build.gradle';

  // We first need to identify build type and flavor from the specified variant
  const { buildType, flavor } = splitVariant(gradleFilePath, variant);

  // Using the buildtype and flavor we create the path to the correct AndroidManifest.xml
  const paths = ['app/build/intermediates/manifests/full'];
  if (flavor) {
    paths.push(flavor);
  }

  if (isSeparateBuildEnabled(gradleFilePath)) {
      paths.push('x86');
  }

  paths.push(buildType);
  paths.push('AndroidManifest.xml');
  return paths.join('/');
}

function getActivityClass(args) {
  // Get the complete path to the correct activity class depening upon the variant
  const manifestFile = getManifestFile(args.variant || 'debug');
  const content = fs.readFileSync(manifestFile, 'utf8');

  //Find the correct package name from the manifest file
  const packageName = content.match(/package="(.+?)"/)[1];

  //Find the correct activityName from the manifestFile
  const activityPathRegex = new RegExp(`android:name="(.+?\.${args.mainActivity})"`);
  const activityPath = content.match(activityPathRegex)[1];
  return `${packageName}/${activityPath}`;
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
