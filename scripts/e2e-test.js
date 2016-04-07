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
 * --packager - to test that application can be installed and that packager works but don't start the application
 * --skip-cli-install - to test not in SI mode without installing react-native-cli globally
 */
/*eslint-disable no-undef */
require('shelljs/global');
const path = require('path');

const SCRIPTS = __dirname;
const ROOT = path.normalize(path.join(__dirname, '..'));

const TEMP=exec('mktemp -d /tmp/react-native-XXXXXXXX').stdout.trim();
// To make sure we actually installed the local version
// of react-native, we will create a temp file inside the template
// and check that it exists after `react-native init
const MARKER_IOS = exec(`mktemp ${ROOT}/local-cli/generator-ios/templates/app/XXXXXXXX`).stdout.trim();
const MARKER_ANDROID = exec(`mktemp ${ROOT}/local-cli/generator-android/templates/src/XXXXXXXX`).stdout.trim();

let SERVER_PID;
let APPIUM_PID;

const args = process.argv.slice(2);

function cleanup(errorCode) {
  if (errorCode !== 0) {
    cat(`${TEMP}/server.log`);
    cat(`/usr/local/Cellar/watchman/3.1/var/run/watchman/${process.env.USER}.log`);
  }
  rm(MARKER_IOS);
  rm(MARKER_ANDROID);

  if(SERVER_PID) {
    echo(`Killing packager ${SERVER_PID}`);
    exec(`kill -9 ${SERVER_PID}`);
  }
  if(APPIUM_PID) {
    echo(`Killing appium ${APPIUM_PID}`);
    exec(`kill -9 ${APPIUM_PID}`);
  }
  return errorCode;
}

// install CLI
cd('react-native-cli');
exec('npm pack');
const CLI_PACKAGE = path.join(ROOT, 'react-native-cli', 'react-native-cli-*.tgz');
cd('..');

// can skip cli install for non sudo mode
if(args.indexOf('--skip-cli-install') === -1) {
  if(exec(`npm install -g ${CLI_PACKAGE}`).code) {
    echo('Could not install react-native-cli globally, please run in su mode');
    echo('Or with --skip-cli-install to skip this step');
    exit(cleanup(1));
  }
}

if (args.indexOf('--android') !== -1) {
  if (exec('./gradlew :ReactAndroid:installArchives -Pjobs=1 -Dorg.gradle.jvmargs="-Xmx512m -XX:+HeapDumpOnOutOfMemoryError"').code) {
    echo('Failed to compile Android binaries');
    exit(cleanup(1));
  }
}

if (exec('npm pack').code) {
  echo('Failed to pack react-native');
  exit(cleanup(1));
}

// test begins
const PACKAGE = path.join(ROOT, 'react-native-*.tgz');
cd(TEMP);
if (exec(`react-native init EndToEndTest --version ${PACKAGE}`).code) {
  echo('Failed to execute react-native init');
  echo('Most common reason is npm registry connectivity, try again');
  exit(cleanup(1));
}
cd('EndToEndTest');

if(args.indexOf('--android') !== -1) {
  echo('Running an Android e2e test');
  echo('Installing e2e framework');
  if(exec('npm install --save-dev appium@1.5.1 mocha@2.4.5 wd@0.3.11 colors@1.0.3').code) {
    echo('Failed to install appium');
    exit(cleanup(1));
  }
  cp(`${SCRIPTS}/android-e2e-test.js`, 'android-e2e-test.js');
  cd('android');
  echo('Downloading Maven deps');
  exec('./gradlew :app:copyDownloadableDepsToLibs');
  // Make sure we installed local version of react-native
  if (!test('-e', path.basename(MARKER_ANDROID))) {
    echo('Android marker was not found, react native init command failed?');
    exit(cleanup(1));
  }
  cd('..');
  echo('Starting packager server');
  SERVER_PID = exec('REACT_NATIVE_MAX_WORKERS=1 npm start', {async: true}).pid;
  echo('Starting appium server');
  APPIUM_PID = exec('node ./node_modules/.bin/appium', {async: true}).pid;
  cp('~/.android/debug.keystore', 'android/keystores/debug.keystore');
  echo('Building app');
  if (exec('buck build android/app').code) {
    echo('could not execute Buck build, is it installed and in PATH?');
    exit(cleanup(1));
  }
  echo('Executing android e2e test');
  if (exec('node node_modules/.bin/_mocha android-e2e-test.js').code) {
    exit(cleanup(1));
  }
  exit(cleanup(0));
}



// exit(cleanup(0));
/*eslint-enable no-undef */
