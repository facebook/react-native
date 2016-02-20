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
const findMatchingSimulator = require('./findMatchingSimulator');
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
    default: null,
  }, {
    command: 'scheme',
    description: 'Explicitly set Xcode scheme to use',
    type: 'string',
    required: false,
  }], argv);

  process.chdir('ios');
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    throw new Error(`Could not find Xcode project files in ios folder`);
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name));
  const scheme = args.scheme || inferredSchemeName
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);

  try {
    var simulators = JSON.parse(
      child_process.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], {encoding: 'utf8'})
    );
  } catch (e) {
    throw new Error(`Could not parse the simulator list output`);
  }

  const selectedSimulator = findMatchingSimulator(simulators, args.simulator);
  if (!selectedSimulator) {
    throw new Error(`Cound't find ${args.simulator} simulator`);
  }

  const simulatorFullName = `${selectedSimulator.name} (${selectedSimulator.version})`;
  console.log(`Launching ${simulatorFullName}...`);
  try {
    child_process.spawnSync('xcrun', ['instruments', '-w', selectedSimulator.udid]);
  } catch(e) {
    // instruments always fail with 255 because it expects more arguments,
    // but we want it to only launch the simulator
  }

  const xcodebuildArgs = [
    xcodeProject.isWorkspace ? '-workspace' : '-project', xcodeProject.name,
    '-scheme', scheme,
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

module.exports = runIOS;
