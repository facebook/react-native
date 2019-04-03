/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script tests that React Native end to end installation/bootstrap works for different platforms
 * Available arguments:
 * --ios - 'react-native init' and check iOS app doesn't redbox
 * --tvos - 'react-native init' and check tvOS app doesn't redbox
 * --android - 'react-native init' and check Android app doesn't redbox
 * --js - 'react-native init' and only check the packager returns a bundle
 * --skip-cli-install - to skip react-native-cli global installation (for local debugging)
 * --retries [num] - how many times to retry possible flaky commands: yarn add and running tests, default 1
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
const MARKER = exec(`mktemp ${ROOT}/template/XXXXXXXX`).stdout.trim();
const numberOfRetries = argv.retries || 1;
let SERVER_PID;
let APPIUM_PID;
let exitCode;

// Make sure we installed local version of react-native
function checkMarker() {
  if (!test('-e', path.basename(MARKER))) {
    echo('Marker was not found, react native init command failed?');
    exitCode = 1;
    throw Error(exitCode);
  }
}

try {
  // install CLI
  const CLI_PACKAGE = 'react-native-cli';
  if (!argv['skip-cli-install']) {
    if (exec(`yarn global add ${CLI_PACKAGE}`).code) {
      echo('Could not install react-native-cli globally.');
      echo('Run with --skip-cli-install to skip this step');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  if (argv.android) {
    if (
      exec(
        './gradlew :ReactAndroid:installArchives -Pjobs=1 -Dorg.gradle.jvmargs="-Xmx512m -XX:+HeapDumpOnOutOfMemoryError"',
      ).code
    ) {
      echo('Failed to compile Android binaries');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  if (exec('yarn pack').code) {
    echo('Failed to pack react-native');
    exitCode = 1;
    throw Error(exitCode);
  }

  const PACKAGE = path.join(ROOT, 'react-native-*.tgz');
  cd(TEMP);
  if (
    tryExecNTimes(
      () => {
        exec('sleep 10s');
        return exec(`react-native init EndToEndTest --version ${PACKAGE}`).code;
      },
      numberOfRetries,
      () => rm('-rf', 'EndToEndTest'),
    )
  ) {
    echo('Failed to execute react-native init');
    echo('Most common reason is npm registry connectivity, try again');
    exitCode = 1;
    throw Error(exitCode);
  }

  cd('EndToEndTest');

  if (argv.android) {
    echo('Running an Android end-to-end test');
    checkMarker();
    echo('Installing end-to-end framework');
    if (
      tryExecNTimes(
        () =>
          exec(
            'yarn add --dev appium@1.11.1 mocha@2.4.5 wd@1.11.1 colors@1.0.3 pretty-data2@0.40.1',
            {silent: true},
          ).code,
        numberOfRetries,
      )
    ) {
      echo('Failed to install appium');
      echo('Most common reason is npm registry connectivity, try again');
      exitCode = 1;
      throw Error(exitCode);
    }
    cp(`${SCRIPTS}/android-e2e-test.js`, 'android-e2e-test.js');
    cd('android');
    echo('Downloading Maven deps');
    exec('./gradlew :app:copyDownloadableDepsToLibs');
    cd('..');

    exec('rm android/app/debug.keystore');
    if (
      exec(
        'keytool -genkey -v -keystore android/app/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"',
      ).code
    ) {
      echo('Key could not be generated');
      exitCode = 1;
      throw Error(exitCode);
    }

    echo(`Starting appium server, ${APPIUM_PID}`);
    const appiumProcess = spawn('node', ['./node_modules/.bin/appium']);
    APPIUM_PID = appiumProcess.pid;

    echo('Building the app');
    if (exec('react-native run-android').code) {
      echo('could not execute react-native run-android');
      exitCode = 1;
      throw Error(exitCode);
    }

    echo(`Starting packager server, ${SERVER_PID}`);
    // shelljs exec('', {async: true}) does not emit stdout events, so we rely on good old spawn
    const packagerProcess = spawn('yarn', ['start', '--max-workers 1'], {
      env: process.env,
    });
    SERVER_PID = packagerProcess.pid;
    // wait a bit to allow packager to startup
    exec('sleep 15s');
    echo('Executing android end-to-end test');
    if (
      tryExecNTimes(() => {
        exec('sleep 10s');
        return exec('node node_modules/.bin/_mocha android-e2e-test.js').code;
      }, numberOfRetries)
    ) {
      echo('Failed to run Android end-to-end tests');
      echo('Most likely the code is broken');
      exitCode = 1;
      throw Error(exitCode);
    }
  }

  if (argv.ios || argv.tvos) {
    checkMarker();
    var iosTestType = argv.tvos ? 'tvOS' : 'iOS';
    echo('Running the ' + iosTestType + ' app');
    cd('ios');
    // shelljs exec('', {async: true}) does not emit stdout events, so we rely on good old spawn
    const packagerEnv = Object.create(process.env);
    packagerEnv.REACT_NATIVE_MAX_WORKERS = 1;
    const packagerProcess = spawn('yarn', ['start', '--nonPersistent'], {
      stdio: 'inherit',
      env: packagerEnv,
    });
    SERVER_PID = packagerProcess.pid;
    exec('sleep 15s');
    // prepare cache to reduce chances of possible red screen "Can't fibd variable __fbBatchedBridge..."
    exec(
      'response=$(curl --write-out %{http_code} --silent --output /dev/null localhost:8081/index.bundle?platform=ios&dev=true)',
    );
    echo(`Starting packager server, ${SERVER_PID}`);
    echo('Running pod install');
    exec('pod install');
    echo('Executing ' + iosTestType + ' end-to-end test');
    if (
      tryExecNTimes(() => {
        exec('sleep 10s');
        let destination = 'platform=iOS Simulator,name=iPhone 5s,OS=12.1';
        let sdk = 'iphonesimulator';
        let scheme = 'EndToEndTest';

        if (argv.tvos) {
          destination = 'platform=tvOS Simulator,name=Apple TV,OS=11.4';
          sdk = 'appletvsimulator';
          scheme = 'EndToEndTest-tvOS';
        }

        return exec(
          [
            'xcodebuild',
            '-workspace',
            '"EndToEndTest.xcworkspace"',
            '-destination',
            `"${destination}"`,
            '-scheme',
            `"${scheme}"`,
            '-sdk',
            sdk,
            '-UseModernBuildSystem=NO',
            'test',
          ].join(' ') +
            ' | ' +
            [
              'xcpretty',
              '--report',
              'junit',
              '--output',
              `"~/react-native/reports/junit/${iosTestType}-e2e/results.xml"`,
            ].join(' ') +
            ' && exit ${PIPESTATUS[0]}',
        ).code;
      }, numberOfRetries)
    ) {
      echo('Failed to run ' + iosTestType + ' end-to-end tests');
      echo('Most likely the code is broken');
      exitCode = 1;
      throw Error(exitCode);
    }
    cd('..');
  }

  if (argv.js) {
    checkMarker();
    // Check the packager produces a bundle (doesn't throw an error)
    if (
      exec(
        'react-native bundle --max-workers 1 --platform android --dev true --entry-file index.js --bundle-output android-bundle.js',
      ).code
    ) {
      echo('Could not build Android bundle');
      exitCode = 1;
      throw Error(exitCode);
    }
    if (
      exec(
        'react-native --max-workers 1 bundle --platform ios --dev true --entry-file index.js --bundle-output ios-bundle.js',
      ).code
    ) {
      echo('Could not build iOS bundle');
      exitCode = 1;
      throw Error(exitCode);
    }
  }
  exitCode = 0;
} finally {
  cd(ROOT);
  rm(MARKER);

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
