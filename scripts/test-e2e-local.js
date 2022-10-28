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

const {exec, exit, pushd, popd, pwd, cd} = require('shelljs');
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  launchAndroidEmulator,
  isPackagerRunning,
  launchPackagerInSeparateWindow,
} = require('./testing-utils');

const {
  generateAndroidArtifacts,
  saveFilesToRestore,
} = require('./release-utils');

const {createHermesTarball} = require('./hermes/hermes-utils');

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
  }).argv;

/*
 * see the test-local-e2e.js script for clean up process
 */

// command order: we ask the user to select if they want to test RN tester
// or RNTestProject

// if they select RN tester, we ask if iOS or Android, and then we run the tests
// if they select RNTestProject, we run the RNTestProject test

// let's check if Metro is already running, if it is let's kill it and start fresh
if (isPackagerRunning() === 'running') {
  exec("lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill");
}

// we need to determine this to handle a couple of iOS related things
const onReleaseBranch = exec('git rev-parse --abbrev-ref HEAD', {
  silent: true,
})
  .stdout.trim()
  .endsWith('-stable');

if (argv.target === 'RNTester') {
  // FIXME: make sure that the commands retains colors
  // (--ansi) doesn't always work
  // see also https://github.com/shelljs/shelljs/issues/86

  if (argv.platform === 'iOS') {
    console.info(
      `We're going to test the ${
        argv.hermes ? 'Hermes' : 'JSC'
      } version of RNTester iOS with the new Architecture enabled`,
    );

    // remember that for this to be successful
    // you should have run bundle install once
    // in your local setup
    // also: if I'm on release branch, I pick the
    // hermes ref from the hermes ref file (see hermes-engine.podspec)
    exec(
      `cd packages/rn-tester && USE_HERMES=${
        argv.hermes ? 1 : 0
      } CI=${onReleaseBranch} RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --ansi`,
    );

    // if everything succeeded so far, we can launch Metro and the app
    // start the Metro server in a separate window
    launchPackagerInSeparateWindow();

    // launch the app on iOS simulator
    pushd('packages/rn-tester');
    exec('npx react-native run-ios --scheme RNTester');
    popd();
  } else {
    // we do the android path here

    launchAndroidEmulator();

    console.info(
      `We're going to test the ${
        argv.hermes ? 'Hermes' : 'JSC'
      } version of RNTester Android with the new Architecture enabled`,
    );
    exec(
      `./gradlew :packages:rn-tester:android:app:${
        argv.hermes ? 'installHermesDebug' : 'installJscDebug'
      } --quiet`,
    );

    // launch the app on Android simulator
    // TODO: we should find a way to make it work like for iOS, via npx react-native run-android
    // currently, that fails with an error.

    // if everything succeeded so far, we can launch Metro and the app
    // start the Metro server in a separate window
    launchPackagerInSeparateWindow();
    // just to make sure that the Android up won't have troubles finding the Metro server
    exec('adb reverse tcp:8081 tcp:8081');
    // launch the app
    exec(
      'adb shell am start -n com.facebook.react.uiapp/com.facebook.react.uiapp.RNTesterActivity',
    );
  }
} else {
  console.info("We're going to test a fresh new RN project");

  // create the local npm package to feed the CLI

  // base setup required (specular to publish-npm.js)
  const tmpPublishingFolder = fs.mkdtempSync(
    path.join(os.tmpdir(), 'rn-publish-'),
  );
  console.info(`The temp publishing folder is ${tmpPublishingFolder}`);

  saveFilesToRestore(tmpPublishingFolder);

  // we need to add the unique timestamp to avoid npm/yarn to use some local caches
  const baseVersion = require('../package.json').version;

  const dateIdentifier = new Date()
    .toISOString()
    .slice(0, -8)
    .replace(/[-:]/g, '')
    .replace(/[T]/g, '-');

  const releaseVersion = `${baseVersion}-${dateIdentifier}`;

  // this is needed to generate the Android artifacts correctly
  exec(`node scripts/set-rn-version.js --to-version ${releaseVersion}`).code;

  // Generate native files (Android only for now)
  generateAndroidArtifacts(releaseVersion, tmpPublishingFolder);

  // create locally the node module
  exec('npm pack');

  const localNodeTGZPath = `${pwd()}/react-native-${releaseVersion}.tgz`;
  exec(`node scripts/set-rn-template-version.js "file:${localNodeTGZPath}"`);

  const repoRoot = pwd();

  pushd('/tmp/');
  // need to avoid the pod install step because it will fail! (see above)
  exec(
    `node ${repoRoot}/cli.js init RNTestProject --template ${repoRoot} --skip-install`,
  );

  cd('RNTestProject');
  exec('yarn install');

  if (argv.platform === 'iOS') {
    // if we want iOS, we need to do pod install - but with a trick
    cd('ios');
    exec('bundle install');

    // for this scenario, we only need to create the debug build
    // (env variable PRODUCTION defines that podspec side)

    // FIXME: need to figure out how to generate the hermes stuff
    // (can I just do a pod install for RNTester iOS and use those files? need to find where they are stored)
    // and get the Hermes reference here for the next phase
    const hermesDir = 'help me';

    // the android ones get set into /private/tmp/maven-local
    const localMavenPath = '/private/tmp/maven-local';

    const tarballOutputPath = createHermesTarball(
      hermesDir,
      'Debug',
      releaseVersion,
      localMavenPath,
    );

    console.log('this is where I generated the tarball', tarballOutputPath);

    // final name needs to be hermes-ios-debug.tar.gz
    // so we need to do something like
    // mv <folder>/hermes-runtime-darwin-debug-*.tar.gz <same-folder>/hermes-ios-debug.tar.gz
    // see this line for reference: https://github.com/facebook/react-native/blob/main/.circleci/config.yml#L1412

    // set HERMES_ENGINE_TARBALL_PATH to point to the local artifacts I just created
    exec(`export HERMES_ENGINE_TARBALL_PATH=${hermesMavenPath}`);

    exec(`USE_HERMES=${argv.hermes ? 1 : 0} bundle exec pod install --ansi`);

    cd('..');
    exec('yarn ios');
  } else {
    // android

    exec(
      'echo "REACT_NATIVE_MAVEN_LOCAL_REPO=/private/tmp/maven-local" >> android/gradle.properties',
    );

    exec('yarn android');
  }
  popd();

  // just cleaning up the temp folder, the rest is done by the test clean script
  exec(`rm -rf ${tmpPublishingFolder}`);
}

exit(0);
