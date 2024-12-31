/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const {
  downloadHermesSourceTarball,
  expandHermesSourceTarball,
} = require('../../../packages/react-native/scripts/hermes/hermes-utils.js');
const {
  generateAndroidArtifacts,
  generateiOSArtifacts,
} = require('../../releases/utils/release-utils');
const circleCIArtifactsUtils = require('./circle-ci-artifacts-utils.js');
const ghaArtifactsUtils = require('./github-actions-utils.js');
const fs = require('fs');
// $FlowIgnore[cannot-resolve-module]
const {spawn} = require('node:child_process');
const os = require('os');
const path = require('path');
const {cp, exec} = require('shelljs');

/*::
type BuildType = 'dry-run' | 'release' | 'nightly' | 'prealpha';
*/

/*
 * Android related utils - leverages android tooling
 */

// this code is taken from the CLI repo, slightly readapted to our needs
// here's the reference folder:
// https://github.com/react-native-community/cli/blob/main/packages/cli-platform-android/src/commands/runAndroid

const emulatorCommand =
  process.env.ANDROID_HOME != null
    ? `${process.env.ANDROID_HOME}/emulator/emulator`
    : 'emulator';

const getEmulators = () => {
  const emulatorsOutput = exec(`${emulatorCommand} -list-avds`).stdout;
  return emulatorsOutput.split(os.EOL).filter(name => name !== '');
};

const launchEmulator = (emulatorName /*: string */) => {
  // we need both options 'cause reasons:
  // from docs: "When using the detached option to start a long-running process, the process will not stay running in the background after the parent exits unless it is provided with a stdio configuration that is not connected to the parent. If the parent's stdio is inherited, the child will remain attached to the controlling terminal."
  // here: https://nodejs.org/api/child_process.html#optionsdetached

  const child_process /*: child_process$ChildProcess */ = spawn(
    emulatorCommand,
    [`@${emulatorName}`],
    {
      detached: true,
      stdio: 'ignore',
    },
  );

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
  packagerPort /*: string */ = process.env.RCT_METRO_PORT ?? '8081',
) /*: 'running' | 'unrecognized' | 'not_running' */ {
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
function launchPackagerInSeparateWindow(folderPath /*: string */) {
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
async function setupCircleCIArtifacts(
  circleciToken /*: ?string */,
  branchName /*: string */,
  useLastSuccessfulPipeline /*: boolean */,
) /*: Promise<?typeof circleCIArtifactsUtils> */ {
  if (circleciToken == null) {
    return null;
  }

  const baseTmpPath = '/tmp/react-native-tmp';
  await circleCIArtifactsUtils.initialize(
    circleciToken,
    baseTmpPath,
    branchName,
    useLastSuccessfulPipeline,
  );
  return circleCIArtifactsUtils;
}

/**
 * Setups the CircleCIArtifacts if a token has been passed
 *
 * Parameters:
 * - @circleciToken a valid CircleCI Token.
 * - @branchName the branch of the name we want to use to fetch the artifacts.
 */
async function setupGHAArtifacts(
  ciToken /*: ?string */,
  branchName /*: string */,
  useLastSuccessfulPipeline /*: boolean */,
) /*: Promise<?typeof ghaArtifactsUtils> */ {
  if (ciToken == null) {
    return null;
  }

  const baseTmpPath = '/tmp/react-native-tmp';
  await ghaArtifactsUtils.initialize(
    ciToken,
    baseTmpPath,
    branchName,
    useLastSuccessfulPipeline,
  );
  return ghaArtifactsUtils;
}

async function downloadArtifacts(
  ciArtifacts /*: typeof circleCIArtifactsUtils */,
  mavenLocalPath /*: string */,
  localNodeTGZPath /*: string */,
) {
  const mavenLocalURL = await ciArtifacts.artifactURLForMavenLocal();
  const hermesURLZip = await ciArtifacts.artifactURLHermesDebug();
  const reactNativeURLZip = await ciArtifacts.artifactURLForReactNative();

  // Cleanup destination folder
  exec(`rm -rf ${ciArtifacts.baseTmpPath()}`);
  exec(`mkdir ${ciArtifacts.baseTmpPath()}`);

  const hermesPathZip = path.join(
    ciArtifacts.baseTmpPath(),
    'hermes-ios-debug.zip',
  );

  const mavenLocalZipPath = `${mavenLocalPath}.zip`;
  console.info(
    `\n[Download] Maven Local Artifacts from ${mavenLocalURL} into ${mavenLocalZipPath}`,
  );
  ciArtifacts.downloadArtifact(mavenLocalURL, mavenLocalZipPath);
  console.info(`Unzipping into ${mavenLocalPath}`);
  exec(`unzip -oq ${mavenLocalZipPath} -d ${mavenLocalPath}`);

  console.info('\n[Download] Hermes');
  ciArtifacts.downloadArtifact(hermesURLZip, hermesPathZip);
  exec(`unzip ${hermesPathZip} -d ${ciArtifacts.baseTmpPath()}/hermes`);
  const hermesPath = path.join(
    ciArtifacts.baseTmpPath(),
    'hermes',
    'hermes-ios-debug.tar.gz',
  );

  console.info(`\n[Download] React Native from  ${reactNativeURLZip}`);
  const reactNativeDestPath = path.join(
    ciArtifacts.baseTmpPath(),
    'react-native',
  );
  const reactNativeZipDestPath = `${reactNativeDestPath}.zip`;
  ciArtifacts.downloadArtifact(reactNativeURLZip, reactNativeZipDestPath);
  exec(`unzip ${reactNativeZipDestPath} -d ${reactNativeDestPath}`);
  // For some reason, the commit on which the Github Action is running is not the same as the one
  // that is running locally. This make so that the react-native package is created with a different
  // commit sha in CI wrt what is used locally.
  // As a result the react-native tgz is different. The next section of code use package that is created
  // in CI as source of truth and sends back the new localNodeTGZ path so that the new apps can
  // use it.
  const tgzName = fs.readdirSync(reactNativeDestPath).filter(file => {
    console.log(file);
    return file.endsWith('.tgz');
  })[0];

  if (tgzName == null) {
    throw new Error('Could not find the tgz file in the react-native folder');
  }

  const basePath = path.dirname(localNodeTGZPath);
  const newLocalNodeTGZ = path.join(basePath, tgzName);
  const reactNativeTGZ = path.join(reactNativeDestPath, tgzName);
  exec(`mv ${reactNativeTGZ} ${newLocalNodeTGZ}`);

  return {hermesPath, newLocalNodeTGZ};
}

function buildArtifactsLocally(
  releaseVersion /*: string */,
  buildType /*: BuildType */,
  reactNativePackagePath /*: string */,
) {
  // this is needed to generate the Android artifacts correctly
  const exitCode = exec(
    `node scripts/releases/set-rn-artifacts-version.js --to-version ${releaseVersion} --build-type ${buildType}`,
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
    `${reactNativePackagePath}/sdks/hermes-engine/hermes-engine.podspec`,
    `${reactNativePackagePath}/sdks/hermes/hermes-engine.podspec`,
  );
  cp(
    `${reactNativePackagePath}/sdks/hermes-engine/hermes-utils.rb`,
    `${reactNativePackagePath}/sdks/hermes/hermes-utils.rb`,
  );
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
  ciArtifacts /*: ?typeof circleCIArtifactsUtils */,
  mavenLocalPath /*: string */,
  localNodeTGZPath /*: string */,
  releaseVersion /*: string */,
  buildType /*: BuildType */,
  reactNativePackagePath /*: string */,
) /*: Promise<{hermesPath: string, newLocalNodeTGZ: string }> */ {
  return ciArtifacts != null
    ? await downloadArtifacts(ciArtifacts, mavenLocalPath, localNodeTGZPath)
    : {
        hermesPath: buildArtifactsLocally(
          releaseVersion,
          buildType,
          reactNativePackagePath,
        ),
        newLocalNodeTGZ: localNodeTGZPath,
      };
}

module.exports = {
  checkPackagerRunning,
  maybeLaunchAndroidEmulator,
  isPackagerRunning,
  launchPackagerInSeparateWindow,
  setupCircleCIArtifacts,
  setupGHAArtifacts,
  prepareArtifacts,
};
