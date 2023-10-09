/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/*
 * This script is a re-interpretation of the old test-manual.e2e.sh script.
 * the idea is to provide a better DX for the manual testing.
 * It's using Javascript over Bash for consistency with the rest of the recent scripts
 * and to make it more accessible for other devs to play around with.
 */

const {exec, pushd, popd, pwd, cd, sed} = require('shelljs');
const updateTemplatePackage = require('./update-template-package');
const yargs = require('yargs');
const path = require('path');
const fs = require('fs');

const {
  checkPackagerRunning,
  maybeLaunchAndroidEmulator,
  launchPackagerInSeparateWindow,
  setupCircleCIArtifacts,
  prepareArtifacts,
} = require('./testing-utils');

const argv = yargs
  .option('t', {
    alias: 'target',
    default: 'RNTester',
    choices: ['RNTester', 'RNTestProject'],
  })
  .option('p', {
    alias: 'platform',
    default: 'iOS',
    choices: ['iOS', 'Android'],
  })
  .option('h', {
    alias: 'hermes',
    type: 'boolean',
    default: true,
  })
  .option('c', {
    alias: 'circleciToken',
    type: 'string',
  }).argv;

// === RNTester === //

/**
 * Start the test for RNTester on iOS.
 *
 * Parameters:
 * - @circleCIArtifacts manager object to manage all the download of CircleCIArtifacts. If null, it will fallback not to use them.
 * - @onReleaseBranch whether we are on a release branch or not
 */
async function testRNTesterIOS(circleCIArtifacts, onReleaseBranch) {
  console.info(
    `We're going to test the ${
      argv.hermes ? 'Hermes' : 'JSC'
    } version of RNTester iOS with the new Architecture enabled`,
  );

  // remember that for this to be successful
  // you should have run bundle install once
  // in your local setup
  if (argv.hermes && circleCIArtifacts != null) {
    const hermesURL = await circleCIArtifacts.artifactURLHermesDebug();
    const hermesPath = path.join(
      circleCIArtifacts.baseTmpPath(),
      'hermes-ios-debug.tar.gz',
    );
    // download hermes source code from manifold
    circleCIArtifacts.downloadArtifact(hermesURL, hermesPath);
    console.info(`Downloaded Hermes in ${hermesPath}`);
    exec(
      `HERMES_ENGINE_TARBALL_PATH=${hermesPath} RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --ansi`,
    );
  } else {
    exec(
      `USE_HERMES=${
        argv.hermes ? 1 : 0
      } CI=${onReleaseBranch} RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --ansi`,
    );
  }

  // if everything succeeded so far, we can launch Metro and the app
  // start the Metro server in a separate window
  launchPackagerInSeparateWindow(pwd());

  // launch the app on iOS simulator
  exec('npx react-native run-ios --scheme RNTester --simulator "iPhone 14"');
}

/**
 * Start the test for RNTester on Android.
 *
 * Parameters:
 * - @circleCIArtifacts manager object to manage all the download of CircleCIArtifacts. If null, it will fallback not to use them.
 */
async function testRNTesterAndroid(circleCIArtifacts) {
  maybeLaunchAndroidEmulator();

  console.info(
    `We're going to test the ${
      argv.hermes ? 'Hermes' : 'JSC'
    } version of RNTester Android with the new Architecture enabled`,
  );

  // Start the Metro server so it will be ready if the app can be built and installed successfully.
  launchPackagerInSeparateWindow(pwd());

  // Wait for the Android Emulator to be properly loaded and bootstrapped
  exec(
    "adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done; input keyevent 82'",
  );

  if (circleCIArtifacts != null) {
    const downloadPath = path.join(
      circleCIArtifacts.baseTmpPath(),
      'rntester.apk',
    );

    const emulatorArch = exec('adb shell getprop ro.product.cpu.abi').trim();
    const rntesterAPKURL = argv.hermes
      ? await circleCIArtifacts.artifactURLForHermesRNTesterAPK(emulatorArch)
      : await circleCIArtifacts.artifactURLForJSCRNTesterAPK(emulatorArch);

    console.info('Start Downloading APK');
    circleCIArtifacts.downloadArtifact(rntesterAPKURL, downloadPath);

    exec(`adb install ${downloadPath}`);
  } else {
    exec(
      `../../gradlew :packages:rn-tester:android:app:${
        argv.hermes ? 'installHermesDebug' : 'installJscDebug'
      } --quiet`,
    );
  }

  // launch the app
  // TODO: we should find a way to make it work like for iOS, via npx react-native run-android
  // currently, that fails with an error.
  exec(
    'adb shell am start -n com.facebook.react.uiapp/com.facebook.react.uiapp.RNTesterActivity',
  );

  // just to make sure that the Android up won't have troubles finding the Metro server
  exec('adb reverse tcp:8081 tcp:8081');
}

/**
 * Function that start testing on RNTester.
 *
 * Parameters:
 * - @circleCIArtifacts manager object to manage all the download of CircleCIArtifacts. If null, it will fallback not to use them.
 * - @onReleaseBranch whether we are on a release branch or not
 */
async function testRNTester(circleCIArtifacts, onReleaseBranch) {
  // FIXME: make sure that the commands retains colors
  // (--ansi) doesn't always work
  // see also https://github.com/shelljs/shelljs/issues/86
  pushd('packages/rn-tester');

  if (argv.platform === 'iOS') {
    await testRNTesterIOS(circleCIArtifacts, onReleaseBranch);
  } else {
    await testRNTesterAndroid(circleCIArtifacts);
  }
  popd();
}

// === RNTestProject === //

async function testRNTestProject(circleCIArtifacts) {
  console.info("We're going to test a fresh new RN project");

  // create the local npm package to feed the CLI

  // base setup required (specular to publish-npm.js)
  const baseVersion = require('../packages/react-native/package.json').version;

  // in local testing, 1000.0.0 mean we are on main, every other case means we are
  // working on a release version
  const buildType = baseVersion !== '1000.0.0' ? 'release' : 'dry-run';

  // we need to add the unique timestamp to avoid npm/yarn to use some local caches
  const dateIdentifier = new Date()
    .toISOString()
    .slice(0, -8)
    .replace(/[-:]/g, '')
    .replace(/[T]/g, '-');

  const releaseVersion = `${baseVersion}-${dateIdentifier}`;

  // Prepare some variables for later use
  const repoRoot = pwd();
  const reactNativePackagePath = `${repoRoot}/packages/react-native`;
  const localNodeTGZPath = `${reactNativePackagePath}/react-native-${releaseVersion}.tgz`;

  const mavenLocalPath =
    circleCIArtifacts != null
      ? path.join(circleCIArtifacts.baseTmpPath(), 'maven-local.zip')
      : '/private/tmp/maven-local';
  const hermesPath = await prepareArtifacts(
    circleCIArtifacts,
    mavenLocalPath,
    localNodeTGZPath,
    releaseVersion,
    buildType,
    reactNativePackagePath,
  );

  updateTemplatePackage({
    'react-native': `file:${localNodeTGZPath}`,
  });

  // create locally the node module
  exec('npm pack --pack-destination ', {cwd: reactNativePackagePath});

  // node pack does not creates a version of React Native with the right name on main.
  // Let's add some defensive programming checks:
  if (!fs.existsSync(localNodeTGZPath)) {
    const tarfile = fs
      .readdirSync(reactNativePackagePath)
      .find(name => name.startsWith('react-native-') && name.endsWith('.tgz'));
    if (!tarfile) {
      throw new Error("Couldn't find a zipped version of react-native");
    }
    exec(
      `cp ${path.join(reactNativePackagePath, tarfile)} ${localNodeTGZPath}`,
    );
  }

  pushd('/tmp/');
  // need to avoid the pod install step - we'll do it later
  exec(
    `node ${reactNativePackagePath}/cli.js init RNTestProject --template ${localNodeTGZPath} --skip-install`,
  );

  cd('RNTestProject');
  exec('yarn install');

  // need to do this here so that Android will be properly setup either way
  exec(
    `echo "react.internal.mavenLocalRepo=${mavenLocalPath}" >> android/gradle.properties`,
  );

  // Update gradle properties to set Hermes as false
  if (!argv.hermes) {
    sed(
      '-i',
      'hermesEnabled=true',
      'hermesEnabled=false',
      'android/gradle.properties',
    );
  }

  // doing the pod install here so that it's easier to play around RNTestProject
  cd('ios');
  exec('bundle install');
  exec(
    `HERMES_ENGINE_TARBALL_PATH=${hermesPath} USE_HERMES=${
      argv.hermes ? 1 : 0
    } bundle exec pod install --ansi`,
  );

  cd('..');

  if (argv.platform === 'iOS') {
    exec('yarn ios');
  } else {
    // android
    exec('yarn android');
  }
  popd();
}

async function main() {
  /*
   * see the test-local-e2e.js script for clean up process
   */

  // command order: we ask the user to select if they want to test RN tester
  // or RNTestProject

  // if they select RN tester, we ask if iOS or Android, and then we run the tests
  // if they select RNTestProject, we run the RNTestProject test

  checkPackagerRunning();

  const branchName = exec('git rev-parse --abbrev-ref HEAD', {
    silent: true,
  }).stdout.trim();
  const onReleaseBranch = branchName.endsWith('-stable');

  let circleCIArtifacts = await setupCircleCIArtifacts(
    argv.circleciToken,
    branchName,
  );

  if (argv.target === 'RNTester') {
    await testRNTester(circleCIArtifacts, onReleaseBranch);
  } else {
    await testRNTestProject(circleCIArtifacts);
  }
}

main();
