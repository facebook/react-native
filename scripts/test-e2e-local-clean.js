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
 * This script, paired with test-e2e-local.js, is the full suite of
 * tooling needed for a successful local testing experience.
 * This script is an helper to clean up the environment fully
 * before running the test suite.
 *
 * You should use this when switching between branches.
 *
 * It will:
 *  - clean up node modules
 *  - clean up the build folder (derived data, gradlew cleanAll)
 *  - clean up the pods folder for RNTester (pod install) (and Podfile.lock too)
 *  - kill all packagers
 *  - remove RNTestProject folder
 *
 * an improvements to consider:
 *   - an option to uninstall the apps (RNTester, RNTestProject) from emulators
 */

const {exec, exit} = require('shelljs');

const {isPackagerRunning} = require('./testing-utils');

console.info('\n** Starting the clean up process **\n');

// let's check if Metro is already running, if it is let's kill it and start fresh
if (isPackagerRunning() === 'running') {
  exec("lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill");
  console.info('\n** Killed Metro **\n');
}

// Android
console.info('\n** Cleaning Gradle build artifacts **\n');
exec('./gradlew cleanAll');
exec('rm -rf /tmp/maven-local');

// iOS
console.info('\n** Nuking the derived data folder **\n');
exec('rm -rf ~/Library/Developer/Xcode/DerivedData');

console.info('\n** Removing the hermes-engine pod cache **\n');
exec('rm -rf ~/Library/Caches/CocoaPods/Pods/External/hermes-engine');

// RNTester Pods
console.info('\n** Removing the RNTester Pods **\n');
exec('rm -rf packages/rn-tester/Pods');

// I'm not sure we want to also remove the lock file
// exec('rm -rf packages/rn-tester/Podfile.lock');

// RNTestProject
console.info('\n** Removing the RNTestProject folder **\n');
exec('rm -rf /tmp/RNTestProject');

// final clean up
console.info('\n** Final git level wipe **\n');
// clean unstaged changes from git
exec('git checkout -- .');
// remove all the untracked files
exec('git clean -fdx');

console.info(
  '\n** Clean up process completed\nPlease remember to run yarn install if you are planning to test again\n',
);
exit(0);
