/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec, cp} = require('shelljs');
const fs = require('fs');
const os = require('os');
const {spawn} = require('node:child_process');
const path = require('path');

const circleCIArtifactsUtils = require('./circle-ci-artifacts-utils.js');

const {
  generateAndroidArtifacts,
  generateiOSArtifacts,
} = require('./release-utils');

const {
  downloadHermesSourceTarball,
  expandHermesSourceTarball,
} = require('../packages/react-native/scripts/hermes/hermes-utils.js');

/*
 * Android related utils - leverages android tooling
 */

// this code is taken from the CLI repo, slightly readapted to our needs
// here's the reference folder:
// https://github.com/react-native-community/cli/blob/main/packages/cli-platform-android/src/commands/runAndroid

const emulatorCommand = process.env.ANDROID_HOME
  ? `${process.env.ANDROID_HOME}/emulator/emulator`
  : 'emulator';

const getEmulators = () => {
  const emulatorsOutput = exec(`${emulatorCommand} -list-avds`).stdout;
  return emulatorsOutput.split(os.EOL).filter(name => name !== '');
};

const launchEmulator = emulatorName => {
  // we need both options 'cause reasons:
  // from docs: "When using the detached option to start a long-running process, the process will not stay running in the background after the parent exits unless it is provided with a stdio configuration that is not connected to the parent. If the parent's stdio is inherited, the child will remain attached to the controlling terminal."
  // here: https://nodejs.org/api/child_process.html#optionsdetached

  const child_process = spawn(emulatorCommand, [`@${emulatorName}`], {
    detached: true,
    stdio: 'ignore',
  });

  child_process.unref();
};

function tryLaunchEmulator() {
  const emulators = getEmulators();
  if (emulators.length > 0) {
    try {
      launchEmulator(emulators[0]);

      return {success: true};
    } catch (error) {
      return {success: false, error};
    }
  }
  return {
    success: false,
    error: 'No emulators found as an output of `emulator -list-avds`',
  };
}

function hasConnectedDevice() {
  const physicalDevices = exec('adb devices | grep -v emulator', {silent: true})
    .stdout.trim()
    .split('\n')
    .slice(1);
  return physicalDevices.length > 0;
}

function maybeLaunchAndroidEmulator() {
  if (hasConnectedDevice()) {
    console.info('Already have a device connected. Skip launching emulator.');
    return;
  }

  const result = tryLaunchEmulator();
  if (result.success) {
    console.info('Successfully launched emulator.');
  } else {
    console.error(`Failed to launch emulator. Reason: ${result.error || ''}.`);
    console.warn(
      'Please launch an emulator manually or connect a device. Otherwise app may fail to launch.',
    );
  }
}

/*
 * iOS related utils - leverages xcodebuild
 */

/*
 * Metro related utils
 */

// inspired by CLI again https://github.com/react-native-community/cli/blob/main/packages/cli-tools/src/isPackagerRunning.ts

function isPackagerRunning(
  packagerPort = process.env.RCT_METRO_PORT || '8081',
) {
  try {
    const status = exec(`curl http://localhost:${packagerPort}/status`, {
      silent: true,
    }).stdout;

    return status === 'packager-status:running' ? 'running' : 'unrecognized';
  } catch (_error) {
    return 'not_running';
  }
}

// this is a very limited implementation of how this should work
function launchPackagerInSeparateWindow(folderPath) {
  const command = `tell application "Terminal" to do script "cd ${folderPath} && yarn start"`;
  exec(`osascript -e '${command}' >/dev/null <<EOF`);
}

/**
 * Checks if Metro is running and it kills it if that's the case
 */
function checkPackagerRunning() {
  if (isPackagerRunning() === 'running') {
    exec(
      "lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill",
    );
  }
}

// === ARTIFACTS === //

/**
 * Setups the CircleCIArtifacts if a token has been passed
 *
 * Parameters:
 * - @circleciToken a valid CircleCI Token.
 * - @branchName the branch of the name we want to use to fetch the artifacts.
 */
async function setupCircleCIArtifacts(circleciToken, branchName) {
  if (!circleciToken) {
    return null;
  }

  const baseTmpPath = '/tmp/react-native-tmp';
  await circleCIArtifactsUtils.initialize(
    circleciToken,
    baseTmpPath,
    branchName,
  );
  return circleCIArtifactsUtils;
}

async function downloadArtifactsFromCircleCI(
  circleCIArtifacts,
  mavenLocalPath,
  localNodeTGZPath,
) {
  const mavenLocalURL = await circleCIArtifacts.artifactURLForMavenLocal();
  const hermesURL = await circleCIArtifacts.artifactURLHermesDebug();

  const hermesPath = path.join(
    circleCIArtifacts.baseTmpPath(),
    'hermes-ios-debug.tar.gz',
  );

  console.info('[Download] Maven Local Artifacts');
  circleCIArtifacts.downloadArtifact(mavenLocalURL, mavenLocalPath);
  console.info('[Download] Hermes');
  circleCIArtifacts.downloadArtifact(hermesURL, hermesPath);

  return hermesPath;
}

function buildArtifactsLocally(
  releaseVersion,
  buildType,
  reactNativePackagePath,
) {
  // this is needed to generate the Android artifacts correctly
  const exitCode = exec(
    `node scripts/set-rn-version.js --to-version ${releaseVersion} --build-type ${buildType}`,
  ).code;

  if (exitCode !== 0) {
    console.error(
      `Failed to set the RN version. Version ${releaseVersion} is not valid for ${buildType}`,
    );
    process.exit(exitCode);
  }

  // Generate native files for Android
  generateAndroidArtifacts(releaseVersion);

  // Generate iOS Artifacts
  const jsiFolder = `${reactNativePackagePath}/ReactCommon/jsi`;
  const hermesCoreSourceFolder = `${reactNativePackagePath}/sdks/hermes`;

  if (!fs.existsSync(hermesCoreSourceFolder)) {
    console.info('The Hermes source folder is missing. Downloading...');
    downloadHermesSourceTarball();
    expandHermesSourceTarball();
  }

  // need to move the scripts inside the local hermes cloned folder
  // cp sdks/hermes-engine/utils/*.sh <your_hermes_checkout>/utils/.
  cp(
    `${reactNativePackagePath}/sdks/hermes-engine/utils/*.sh`,
    `${reactNativePackagePath}/sdks/hermes/utils/.`,
  );

  // for this scenario, we only need to create the debug build
  // (env variable PRODUCTION defines that podspec side)
  const buildTypeiOSArtifacts = 'Debug';

  // the android ones get set into /private/tmp/maven-local
  const localMavenPath = '/private/tmp/maven-local';

  // Generate native files for iOS
  const hermesPath = generateiOSArtifacts(
    jsiFolder,
    hermesCoreSourceFolder,
    buildTypeiOSArtifacts,
    localMavenPath,
  );

  return hermesPath;
}

/**
 * It prepares the artifacts required to run a new project created from the template
 *
 * Parameters:
 * - @circleCIArtifacts manager object to manage all the download of CircleCIArtifacts. If null, it will fallback not to use them.
 * - @mavenLocalPath path to the local maven repo that is needed by Android.
 * - @localNodeTGZPath path where we want to store the react-native tgz.
 * - @releaseVersion the version that is about to be released.
 * - @buildType the type of build we want to execute if we build locally.
 * - @reactNativePackagePath the path to the react native package within the repo.
 *
 * Returns:
 * - @hermesPath the path to hermes for iOS
 */
async function prepareArtifacts(
  circleCIArtifacts,
  mavenLocalPath,
  localNodeTGZPath,
  releaseVersion,
  buildType,
  reactNativePackagePath,
) {
  return circleCIArtifacts != null
    ? await downloadArtifactsFromCircleCI(
        circleCIArtifacts,
        mavenLocalPath,
        localNodeTGZPath,
      )
    : buildArtifactsLocally(releaseVersion, buildType, reactNativePackagePath);
}

module.exports = {
  checkPackagerRunning,
  maybeLaunchAndroidEmulator,
  isPackagerRunning,
  launchPackagerInSeparateWindow,
  setupCircleCIArtifacts,
  prepareArtifacts,
};
