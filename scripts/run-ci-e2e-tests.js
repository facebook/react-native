/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * This script tests that React Native end to end installation/bootstrap works for different platforms
 * Available arguments:
 * --ios - to test only ios application end to end
 * --android - to test only android application end to end
 * --js - to test that JS in the application is compilable
 * --skip-cli-install - to skip react-native-cli global installation (for local debugging)
 * --retries [num] - how many times to retry possible flaky commands: npm install and running tests, default 1
 */
/*eslint-disable no-undef */
require('shelljs/global');

const spawn = require('child_process').spawn;
const argv = require('yargs').argv;
const path = require('path');

const SCRIPTS = __dirname;
const ROOT = path.normalize(path.join(__dirname, '..'));
const tryExecNTimes = require('./try-n-times');

const TEMP = exec('mktemp -d /tmp/react-native-XXXXXXXX').stdout.trim();
// To make sure we actually installed the local version
// of react-native, we will create a temp file inside the template
// and check that it exists after `react-native init
const MARKER_IOS = exec(`mktemp ${ROOT}/local-cli/generator-ios/templates/app/XXXXXXXX`).stdout.trim();
const MARKER_ANDROID = exec(`mktemp ${ROOT}/local-cli/generator-android/templates/src/XXXXXXXX`).stdout.trim();
const numberOfRetries = argv.retries || 1;
let SERVER_PID;
let APPIUM_PID;
let exitCode;

try {
  // install CLI
  cd('react-native-cli');
  exec('npm pack');
  const CLI_PACKAGE = path.join(ROOT, 'react-native-cli', 'react-native-cli-*.tgz');
  cd('..');

  // can skip cli install for non sudo mode
  if (!argv['skip-cli-install']) {
    if (exec(`npm install -g ${CLI_PACKAGE}`).code) {
      echo('Could not install react-native-cli globally, please run in su mode');
      echo('Or with --skip-cli-install to skip this step');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  if (argv['android']) {
    if (exec('./gradlew :ReactAndroid:installArchives -Pjobs=1 -Dorg.gradle.jvmargs="-Xmx512m -XX:+HeapDumpOnOutOfMemoryError"').code) {
      echo('Failed to compile Android binaries');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  if (exec('npm pack').code) {
    echo('Failed to pack react-native');
    exitCode = 1;
    throw Error(exitCode);
  }

  const PACKAGE = path.join(ROOT, 'react-native-*.tgz');
  cd(TEMP);
  if (tryExecNTimes(
    () => {
      exec('sleep 10s');
      return exec(`react-native init EndToEndTest --version ${PACKAGE}`).code;
    },
    numberOfRetries,
    () => rm('-rf', 'EndToEndTest'))) {
      echo('Failed to execute react-native init');
      echo('Most common reason is npm registry connectivity, try again');
      exitCode = 1;
      throw Error(exitCode);
  }

  cd('EndToEndTest');

  if (argv['android']) {
    echo('Running an Android e2e test');
    echo('Installing e2e framework');
    if (tryExecNTimes(
      () => exec('npm install --save-dev appium@1.5.1 mocha@2.4.5 wd@0.3.11 colors@1.0.3 pretty-data2@0.40.1', { silent: true }).code,
      numberOfRetries)) {
        echo('Failed to install appium');
        echo('Most common reason is npm registry connectivity, try again');
        exitCode = 1;
        throw Error(exitCode);
    }
    cp(`${SCRIPTS}/android-e2e-test.js`, 'android-e2e-test.js');
    cd('android');
    echo('Downloading Maven deps');
    exec('./gradlew :app:copyDownloadableDepsToLibs');
    // Make sure we installed local version of react-native
    if (!test('-e', path.basename(MARKER_ANDROID))) {
      echo('Android marker was not found, react native init command failed?');
      exitCode = 1;
      throw Error(exitCode);
    }
    cd('..');
    exec('keytool -genkey -v -keystore android/keystores/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US"');

    echo(`Starting packager server, ${SERVER_PID}`);
    const appiumProcess = spawn('node', ['./node_modules/.bin/appium']);
    APPIUM_PID = appiumProcess.pid;
    echo(`Starting appium server, ${APPIUM_PID}`);
    echo('Building app');
    if (exec('buck build android/app').code) {
      echo('could not execute Buck build, is it installed and in PATH?');
      exitCode = 1;
      throw Error(exitCode);
    }
    let packagerEnv = Object.create(process.env);
    packagerEnv.REACT_NATIVE_MAX_WORKERS = 1;
    // shelljs exec('', {async: true}) does not emit stdout events, so we rely on good old spawn
    const packagerProcess = spawn('npm', ['start'], {
      // stdio: 'inherit',
      env: packagerEnv
    });
    SERVER_PID = packagerProcess.pid;
    // wait a bit to allow packager to startup
    exec('sleep 15s');
    echo('Executing android e2e test');
    if (tryExecNTimes(
      () => {
        exec('sleep 10s');
        return exec('node node_modules/.bin/_mocha android-e2e-test.js').code;
      },
      numberOfRetries)) {
        echo('Failed to run Android e2e tests');
        echo('Most likely the code is broken');
        exitCode = 1;
        throw Error(exitCode);
    }
  }

  if (argv['ios']) {
    echo('Running an iOS app');
    cd('ios');
    // Make sure we installed local version of react-native
    if (!test('-e', path.join('EndToEndTest', path.basename(MARKER_IOS)))) {
      echo('iOS marker was not found, `react-native init` command failed?');
      exitCode = 1;
      throw Error(exitCode);
    }
    // shelljs exec('', {async: true}) does not emit stdout events, so we rely on good old spawn
    let packagerEnv = Object.create(process.env);
    packagerEnv.REACT_NATIVE_MAX_WORKERS = 1;
    const packagerProcess = spawn('npm', ['start', '--', '--non-persistent'],
      {
        stdio: 'inherit',
        env: packagerEnv
      });
    SERVER_PID = packagerProcess.pid;
    exec('sleep 15s');
    // prepare cache to reduce chances of possible red screen "Can't fibd variable __fbBatchedBridge..."
    exec('response=$(curl --write-out %{http_code} --silent --output /dev/null localhost:8081/index.ios.bundle?platform=ios&dev=true)');
    echo(`Starting packager server, ${SERVER_PID}`);
    echo('Executing ios e2e test');
    if (tryExecNTimes(
      () => {
        exec('sleep 10s');
        return exec('xcodebuild -scheme EndToEndTest -sdk iphonesimulator test | xcpretty && exit ${PIPESTATUS[0]}').code;
      },
      numberOfRetries)) {
        echo('Failed to run iOS e2e tests');
        echo('Most likely the code is broken');
        exitCode = 1;
        throw Error(exitCode);
    }
    cd('..');
  }

  if (argv['js']) {
    // Check the packager produces a bundle (doesn't throw an error)
    if (exec('react-native bundle --platform android --dev true --entry-file index.android.js --bundle-output android-bundle.js').code) {
      echo('Could not build android package');
      exitCode = 1;
      throw Error(exitCode);
    }
    if (exec('react-native bundle --platform ios --dev true --entry-file index.ios.js --bundle-output ios-bundle.js').code) {
      echo('Could not build ios package');
      exitCode = 1;
      throw Error(exitCode);
    }
    if (exec(`${ROOT}/node_modules/.bin/flow check`).code) {
      echo('Flow check does not pass');
      exitCode = 1;
      throw Error(exitCode);
    }
  }
  exitCode = 0;

} finally {
  cd(ROOT);
  rm(MARKER_IOS);
  rm(MARKER_ANDROID);

  if (SERVER_PID) {
    echo(`Killing packager ${SERVER_PID}`);
    exec(`kill -9 ${SERVER_PID}`);
    // this is quite drastic but packager starts a daemon that we can't kill by killing the parent process
    // it will be fixed in April (quote David Aurelio), so until then we will kill the zombie by the port number
    exec("lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill");
  }
  if (APPIUM_PID) {
    echo(`Killing appium ${APPIUM_PID}`);
    exec(`kill -9 ${APPIUM_PID}`);
  }
}
exit(exitCode);

/*eslint-enable no-undef */
