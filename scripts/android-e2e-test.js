'use strict';

/**
 * e2e test that tests Hot Module Reloading works for a new app
 * Check out more examples: https://github.com/appium/sample-code/tree/master/sample-code/examples/node and
 * https://www.npmjs.com/package/wd-android
 *
 * To run this test using BUCK (a bit faster):
 * - npm start &
 * - npm run appium &
 * - cd android
 * - cp ~/.android/debug.keystore keystores/debug.keystore
 * - ./gradlew :app:copyDownloadableDepsToLibs
 * - buck build android/app
 * - npm run e2e-android
 *
 * To run this test using Gradle:
 * - npm start &
 * - npm run appium &
 * - cd android
 * - ./gradlew :app:assembleDebug
 * - npm run e2e-android -- --gradle
 *
 */

const wd = require('wd');
const path = require('path');
const fs = require('fs');
require('colors');

describe('Android Test App', function () {
  this.timeout(300000);
  let driver;

  before(function () {
    driver = wd.promiseChainRemote({
      host: 'localhost',
      port: 4723
    });
    driver.on('status', function (info) {
      console.log(info.cyan);
    });
    driver.on('command', function (meth, path, data) {
      console.log(' > ' + meth.yellow, path.grey, data || '');
    });
    driver.on('http', function (meth, path, data) {
      console.log(' > ' + meth.magenta, path, (data || '').grey);
    });


    const desired = {
      platformName: 'Android',
      deviceName: 'Android Emulator',
      app: process.argv.indexOf('--gradle') === -1 ?
        path.resolve('buck-out/gen/android/app/app.apk') :
        path.resolve('android/app/build/outputs/apk/app-debug.apk')
    };

    return driver
      .init(desired)
      .setImplicitWaitTimeout(10000);
  });

  after(function () {
    return driver.quit();
  });

  it('should have Hot Module Reloading working', function () {
    const androidAppCode = fs.readFileSync('index.android.js', 'utf-8');
    // http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU
    return driver.
    waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]').
    pressDeviceKey(82).
    elementByXPath('//android.widget.TextView[starts-with(@text, "Enable Hot Reloading")]').
    click().
    waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]').
    then(() => {
      const newContents = androidAppCode.replace('Welcome to React Native!', 'Welcome to React Native with HMR!');
      fs.writeFileSync('index.android.js', newContents, 'utf-8');
    }).
    waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native with HMR!")]').
    finally(() => {
      fs.writeFileSync('index.android.js', androidAppCode, 'utf-8');
    });
  });
});