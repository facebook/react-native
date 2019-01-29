/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Used in run-ci-e2e-test.js and executed in Circle CI.
 * E2e test that verifies that init app can be installed, compiled, started and Hot Module reloading and Chrome debugging work.
 * For other examples of appium refer to: https://github.com/appium/sample-code/tree/master/sample-code/examples/node and
 * https://www.npmjs.com/package/wd-android
 *
 *
 * To set up:
 * - npm install --save-dev appium@1.5.1 mocha@2.4.5 wd@0.3.11 colors@1.0.3 pretty-data2@0.40.1
 * - cp <this file> <to app installation path>
 * - keytool -genkey -v -keystore android/keystores/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US
 *
 * To run this test:
 * - npm start
 * - node node_modules/.bin/appium
 * - (cd android && ./gradlew :app:copyDownloadableDepsToLibs)
 * - buck build android/app
 * - node ../node_modules/.bin/_mocha ../android-e2e-test.js
 *
 * @format
 */

/* eslint-env mocha */

'use strict';

const wd = require('wd');
const path = require('path');
const fs = require('fs');
const pd = require('pretty-data2').pd;
require('colors');
// value in ms to print out screen contents, set this value in CI to debug if tests are failing
const appiumDebugInterval = process.env.APPIUM_DEBUG_INTERVAL;

describe('Android Test App', function() {
  this.timeout(600000);
  let driver;
  let debugIntervalId;

  before(function() {
    driver = wd.promiseChainRemote({
      host: 'localhost',
      port: 4723,
    });
    driver.on('status', function(info) {
      console.log(info.cyan);
    });
    driver.on('command', function(method, command, data) {
      if (command === 'source()' && data) {
        console.log(
          ' > ' + method.yellow,
          'Screen contents'.grey,
          '\n',
          pd.xml(data).yellow,
        );
      } else {
        console.log(' > ' + method.yellow, command.grey, data || '');
      }
    });
    driver.on('http', function(method, urlPath, data) {
      console.log(' > ' + method.magenta, urlPath, (data || '').grey);
    });

    // every interval print what is on the screen
    if (appiumDebugInterval) {
      debugIntervalId = setInterval(() => {
        // it driver.on('command') will log the screen contents
        driver.source();
      }, appiumDebugInterval);
    }

    const desired = {
      platformName: 'Android',
      deviceName: 'Android Emulator',
      app: path.resolve('buck-out/gen/android/app/app.apk'),
    };

    // React Native in dev mode often starts with Red Box "Can't fibd variable __fbBatchedBridge..."
    // This is fixed by clicking Reload JS which will trigger a request to packager server
    return driver
      .init(desired)
      .setImplicitWaitTimeout(5000)
      .waitForElementByXPath('//android.widget.Button[@text="Reload JS"]')
      .then(
        elem => {
          elem.click();
        },
        err => {
          // ignoring if Reload JS button can't be located
        },
      )
      .setImplicitWaitTimeout(150000);
  });

  after(function() {
    if (debugIntervalId) {
      clearInterval(debugIntervalId);
    }
    return driver.quit();
  });

  it('should have Hot Module Reloading working', function() {
    const androidAppCode = fs.readFileSync('index.js', 'utf-8');
    let intervalToUpdate;
    return (
      driver
        .waitForElementByXPath(
          '//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]',
        )
        // http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU
        .pressDeviceKey(82)
        .elementByXPath(
          '//android.widget.TextView[starts-with(@text, "Enable Hot Reloading")]',
        )
        .click()
        .waitForElementByXPath(
          '//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]',
        )
        .then(() => {
          let iteration = 0;
          // CI environment can be quite slow and we can't guarantee that it can consistently motice a file change
          // so we change the file every few seconds just in case
          intervalToUpdate = setInterval(() => {
            fs.writeFileSync(
              'index.js',
              androidAppCode.replace(
                'Welcome to React Native!',
                'Welcome to React Native with HMR!' + iteration,
              ),
              'utf-8',
            );
          }, 3000);
        })
        .waitForElementByXPath(
          '//android.widget.TextView[starts-with(@text, "Welcome to React Native with HMR!")]',
        )
        .finally(() => {
          clearInterval(intervalToUpdate);
          fs.writeFileSync('index.js', androidAppCode, 'utf-8');
        })
    );
  });

  it('should have Debug In Chrome working', function() {
    // http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU
    return driver
      .waitForElementByXPath(
        '//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]',
      )
      .pressDeviceKey(82)
      .elementByXPath('//android.widget.TextView[starts-with(@text, "Debug")]')
      .click()
      .waitForElementByXPath(
        '//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]',
      );
  });
});
