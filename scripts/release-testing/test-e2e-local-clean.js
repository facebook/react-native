/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*
 * This script, paired with test-e2e-local.js, is the full suite of
 * tooling needed for a successful local testing experience.
 * This script is an helper to clean up the environment fully
 * before running the test suite.
 *
 * You should use this when switching between branches.
 *
 * It will:
 *  - clean up node modules
 *  - clean up the build folder (derived data, gradlew clean)
 *  - clean up the pods folder for RNTester (pod install) (and Podfile.lock too)
 *  - kill all packagers
 *  - remove RNTestProject folder
 *
 * an improvements to consider:
 *   - an option to uninstall the apps (RNTester, RNTestProject) from emulators
 */

const {VERDACCIO_STORAGE_PATH} = require('../e2e/utils/verdaccio');
const {isPackagerRunning, timeBlock} = require('./utils/testing-utils');
const {exec, exit} = require('shelljs');

console.info('** Starting the clean up process **');

// let's check if Metro is already running, if it is let's kill it and start fresh
if (isPackagerRunning() === 'running') {
  exec("lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill");
  console.info('\n** Killed Metro **\n');
}

// Android
timeBlock('Cleaning Gradle build artifacts', () => {
  exec('./gradlew clean');
  exec('rm -rf package/react-native/ReactAndroid/build');
  exec('rm -rf /tmp/maven-local');
  exec('rm -rf /tmp/react-native-tmp');
});

// iOS
timeBlock('Nuking the derived data folder', () => {
  exec('rm -rf ~/Library/Developer/Xcode/DerivedData');
});

timeBlock('Removing the hermes-engine pod cache', () => {
  exec('rm -rf ~/Library/Caches/CocoaPods/Pods/External/hermes-engine');
});

// RNTester Pods
timeBlock('Removing the RNTester Pods', () => {
  exec('rm -rf packages/rn-tester/Pods');
});

// RNTestProject
timeBlock('Removing the RNTestProject folder', () => {
  exec('rm -rf /tmp/RNTestProject');
});

timeBlock('Removing Verdaccio storage directory', () => {
  exec(`rm -rf ${VERDACCIO_STORAGE_PATH}`);
});

// final clean up
timeBlock('Final git level wipe', () => {
  // clean unstaged changes from git
  exec('git checkout -- .');
  // remove all the untracked files
  exec('git clean -fdx');
});

console.info(
  '\n** Clean up process completed\nPlease remember to run yarn install if you are planning to test again\n',
);
exit(0);
