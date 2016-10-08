/**
* Copyright (c) 2015-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const findXcodeProject = require('./findXcodeProject');
const parseIOSDevicesList = require('./parseIOSDevicesList');
const findMatchingSimulator = require('./findMatchingSimulator');

function runIOS(argv, config, args) {
  process.chdir(args.projectPath);
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new Error('Could not find Xcode project files in ios folder');
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name));
  const scheme = args.scheme || inferredSchemeName;
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);
  const devices = parseIOSDevicesList(
    child_process.execFileSync('xcrun', ['instruments', '-s'], {encoding: 'utf8'})
  );
  if (args.device) {
    const selectedDevice = matchingDevice(devices, args.device);
    if (selectedDevice){
      runOnDevice(selectedDevice, scheme, xcodeProject);
    } else {
      if (devices){
        console.log('Could not find device with the name: "' + args.device + '".');
        console.log('Choose one of the following:');
        printFoundDevices(devices);
      } else {
        console.log('No iOS devices connected.');
      }
    }
  } else if (args.udid) {
    runOnDeviceByUdid(args.udid, scheme, xcodeProject, devices);
  } else {
    runOnSimulator(xcodeProject, args, inferredSchemeName, scheme);
  }
}

function runOnDeviceByUdid(udid, scheme, xcodeProject, devices) {
  const selectedDevice = matchingDeviceByUdid(devices, udid);
  if (selectedDevice){
    runOnDevice(selectedDevice, scheme, xcodeProject);
  } else {
    if (devices){
      console.log('Could not find device with the udid: "' + udid + '".');
      console.log('Choose one of the following:');
      printFoundDevices(devices);
    } else {
      console.log('No iOS devices connected.');
    }
  }
}

function runOnSimulator(xcodeProject, args, inferredSchemeName, scheme){
  try {
    var simulators = JSON.parse(
    child_process.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], {encoding: 'utf8'})
    );
  } catch (e) {
    throw new Error('Could not parse the simulator list output');
  }

  const selectedSimulator = findMatchingSimulator(simulators, args.simulator);
  if (!selectedSimulator) {
    throw new Error(`Cound't find ${args.simulator} simulator`);
  }

  const simulatorFullName = formattedDeviceName(selectedSimulator);
  console.log(`Launching ${simulatorFullName}...`);
  try {
    child_process.spawnSync('xcrun', ['instruments', '-w', selectedSimulator.udid]);
  } catch (e) {
    // instruments always fail with 255 because it expects more arguments,
    // but we want it to only launch the simulator
  }

  buildProject(xcodeProject, selectedSimulator.udid, scheme);

  const appPath = `build/Build/Products/Debug-iphonesimulator/${inferredSchemeName}.app`;
  console.log(`Installing ${appPath}`);
  child_process.spawnSync('xcrun', ['simctl', 'install', 'booted', appPath], {stdio: 'inherit'});

  const bundleID = child_process.execFileSync(
    '/usr/libexec/PlistBuddy',
    ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
    {encoding: 'utf8'}
  ).trim();

  console.log(`Launching ${bundleID}`);
  child_process.spawnSync('xcrun', ['simctl', 'launch', 'booted', bundleID], {stdio: 'inherit'});
}

function runOnDevice(selectedDevice, scheme, xcodeProject){
  buildProject(xcodeProject, selectedDevice.udid, scheme);
  const iosDeployInstallArgs = [
    '--bundle', 'build/Build/Products/Debug-iphoneos/' + scheme + '.app',
    '--id' , selectedDevice.udid,
    '--justlaunch'
  ];
  console.log(`installing and launching your app on ${selectedDevice.name}...`);
  var iosDeployOutput = child_process.spawnSync('ios-deploy', iosDeployInstallArgs, {encoding: 'utf8'});
  if (iosDeployOutput.error) {
    console.log('');
    console.log('** INSTALLATION FAILED **');
    console.log('Make sure you have ios-deploy installed globally.');
    console.log('(e.g "npm install -g ios-deploy")');
  } else {
    console.log('** INSTALLATION SUCCEEDED **');
  }
}

function buildProject(xcodeProject, udid, scheme) {
  const xcodebuildArgs = [
    xcodeProject.isWorkspace ? '-workspace' : '-project', xcodeProject.name,
    '-scheme', scheme,
    '-destination', `id=${udid}`,
    '-derivedDataPath', 'build',
  ];
  console.log(`Building using "xcodebuild ${xcodebuildArgs.join(' ')}"`);
  child_process.spawnSync('xcodebuild', xcodebuildArgs, {stdio: 'inherit'});
}

function matchingDevice(devices, deviceName) {
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].name === deviceName || formattedDeviceName(devices[i]) === deviceName) {
      return devices[i];
    }
  }
}

function matchingDeviceByUdid(devices, udid) {
  for (let i = devices.length - 1; i >= 0; i--) {
    if (devices[i].udid === udid) {
      return devices[i];
    }
  }
}

function formattedDeviceName(simulator) {
  return `${simulator.name} (${simulator.version})`;
}

function printFoundDevices(devices){
  for (let i = devices.length - 1; i >= 0; i--) {
    console.log(devices[i].name + ' Udid: ' + devices[i].udid);
  }
}

module.exports = {
  name: 'run-ios',
  description: 'builds your app and starts it on iOS simulator',
  func: runIOS,
  examples: [
  {
    desc: 'Run on a different simulator, e.g. iPhone 5',
    cmd: 'react-native run-ios --simulator "iPhone 5"',
  },
  {
    desc: 'Pass a non-standard location of iOS directory',
    cmd: 'react-native run-ios --project-path "./app/ios"',
  },
  {
    desc: "Run on a connected device, e.g. Max's iPhone",
    cmd: "react-native run-ios --device 'Max's iPhone'",
  },
  ],
  options: [{
    command: '--simulator [string]',
    description: 'Explicitly set simulator to use',
    default: 'iPhone 6',
  }, {
    command: '--scheme [string]',
    description: 'Explicitly set Xcode scheme to use',
  }, {
    command: '--project-path [string]',
    description: 'Path relative to project root where the Xcode project '
      + '(.xcodeproj) lives. The default is \'ios\'.',
    default: 'ios',
  }, {
    command: '--device [string]',
    description: 'Explicitly set device to use by name',
  },{
    command: '--udid [string]',
    description: 'Explicitly set device to use by udid',
  }]
};
