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
const parseCommandLine = require('../util/parseCommandLine');
const findXcodeProject = require('./findXcodeProject');
const parseIOSSimulatorsList = require('./parseIOSSimulatorsList');
const Promise = require('promise');

/**
 * Starts the app on iOS simulator
 */
function runIOS(argv, config) {
  return new Promise((resolve, reject) => {
    _runIOS(argv, config, resolve, reject);
    resolve();
  });
}

function _runIOS(argv, config, resolve, reject) {
  const args = parseCommandLine([{
    command: 'simulator',
    description: 'Explicitly set simulator to use',
    type: 'string',
    required: false,
    default: 'iPhone 6',
  }], argv);

  process.chdir('ios');
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new Error(`Could not find Xcode project files in ios folder`);
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name));
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);

  const simulators = parseIOSSimulatorsList(
    child_process.execFileSync('xcrun', ['simctl', 'list', 'devices'], {encoding: 'utf8'})
  );
  const selectedSimulator = matchingSimulator(simulators, args.simulator);
  if (!selectedSimulator) {
    throw new Error(`Cound't find ${args.simulator} simulator`);
  }

  const simulatorFullName = `${selectedSimulator.name} (${selectedSimulator.version})`;
  console.log(`Launching ${simulatorFullName}...`);
  try {
    child_process.spawnSync('xcrun', ['instruments', '-w', simulatorFullName]);
  } catch(e) {
    // instruments always fail with 255 because it expects more arguments,
    // but we want it to only launch the simulator
  }

  const xcodebuildArgs = [
    xcodeProject.isWorkspace ? '-workspace' : '-project', xcodeProject.name,
    '-scheme', inferredSchemeName,
    '-destination', `id=${selectedSimulator.udid}`,
    '-derivedDataPath', 'build',
  ];
  console.log(`Building using "xcodebuild ${xcodebuildArgs.join(' ')}"`);
  child_process.spawnSync('xcodebuild', xcodebuildArgs, {stdio: 'inherit'});

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

function matchingSimulator(simulators, simulatorName) {
  for (let i = simulators.length - 1; i >= 0; i--) {
    if (simulators[i].name === simulatorName) {
      return simulators[i];
    }
  }
}

module.exports = runIOS;
