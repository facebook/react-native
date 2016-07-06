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
  });
}

function _runIOS(argv, config, resolve, reject) {
  const args = parseCommandLine([
    {
      command: 'simulator',
      description: 'Explicitly set simulator to use',
      type: 'string',
      required: false,
      default: 'iPhone 6',
    }, {
      command: 'scheme',
      description: 'Explicitly set Xcode scheme to use',
      type: 'string',
      required: false,
    }, {
      command: 'project-path',
      description: 'Path relative to project root where the Xcode project (.xcodeproj) lives. The default is \'ios\'.',
      type: 'string',
      required: false,
      default: 'ios',
    }
  ], argv);

  process.chdir(args['project-path']);
  const xcodeProject = findXcodeProject(fs.readdirSync('.'));
  if (!xcodeProject) {
    reject(new Error(`Could not find Xcode project files in ios folder`));
  }

  const inferredSchemeName = path.basename(xcodeProject.name, path.extname(xcodeProject.name));
  const scheme = args.scheme || inferredSchemeName;
  console.log(`Found Xcode ${xcodeProject.isWorkspace ? 'workspace' : 'project'} ${xcodeProject.name}`);

  const simulators = parseIOSSimulatorsList(
    child_process.execFileSync('xcrun', ['simctl', 'list', 'devices'], {encoding: 'utf8'})
  );
  const selectedSimulator = matchingSimulator(simulators, args.simulator);
  if (!selectedSimulator) {
    reject(new Error(`Cound't find ${args.simulator} simulator`));
  }

  const simulatorFullName = formattedSimulatorName(selectedSimulator)
  console.log(`Launching ${simulatorFullName}...`);
  try {
    child_process.spawnSync('xcrun', ['instruments', '-w', simulatorFullName]);
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

  let appPath = `build/Build/Products/Debug-iphonesimulator/${inferredSchemeName}.app`;
  const xcodeBuildProcess = child_process.spawn('xcodebuild', xcodebuildArgs, {
    stdio: [process.stdin, 'pipe', process.stderr]
  });

  xcodeBuildProcess.stdout.on('data', (data) => {
    process.stdout.write(data);

    // search this part of the process output for a path to the generated app and replace default
    const appPathFromLog = data.toString().match(/Touch (build\/Build\/Products\/.*\/.*\.app)/);
    if (appPathFromLog) {
      appPath = appPathFromLog[1];
    }
  });

  xcodeBuildProcess.on('close', (code) => {
    if (code !== 0) {
      reject(new Error(`xcodebuild process exited with code ${code}`));
      return;
    }

    console.log(`Installing ${appPath}`);
    child_process.spawnSync('xcrun', ['simctl', 'install', 'booted', appPath], {stdio: 'inherit'});

    const bundleID = child_process.execFileSync(
        '/usr/libexec/PlistBuddy',
        ['-c', 'Print:CFBundleIdentifier', path.join(appPath, 'Info.plist')],
        {encoding: 'utf8'}
    ).trim();

    console.log(`Launching ${bundleID}`);
    child_process.spawnSync('xcrun', ['simctl', 'launch', 'booted', bundleID], {stdio: 'inherit'});

    resolve();
  });
}

function matchingSimulator(simulators, simulatorName) {
  for (let i = simulators.length - 1; i >= 0; i--) {
    if (simulators[i].name === simulatorName || formattedSimulatorName(simulators[i]) === simulatorName) {
      return simulators[i];
    }
  }
}

function formattedSimulatorName(simulator) {
  return `${simulator.name} (${simulator.version})`;
}

module.exports = runIOS;
