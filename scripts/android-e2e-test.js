'use strict';

/**
 * Used in e2e-test.sh and executed in CircleCI.
 * E2e test that tests Hot Module Reloading and Chrome Debugging for a bootstrapped app.
 * Check out more examples: https://github.com/appium/sample-code/tree/master/sample-code/examples/node and
 * https://www.npmjs.com/package/wd-android
 *
 * We are not including this into default React Native app because it is quite framework dependent and does not
 * give very much value to the community. But it has a price of adding 4 more packagers.
 *
 * To set up:
 * - npm install --save-dev appium@1.5.1 mocha@2.4.5 wd@0.3.11 colors@1.0.3
 * - cp <this file> <to app installation path>
 * - npm start
 * - node node_modules/.bin/appium
 *
 * To run this test:
 * - cd android
 * - `cp ~/android/debug.keystore keystores/debug.keystore` or `keytool -genkey -v -keystore android/keystores/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US`
 * - ./gradlew :app:copyDownloadableDepsToLibs
 * - cd ..
 * - buck build android/app
 * - node node_modules/.bin/_mocha android-e2e-test.js
 *
 */

const wd = require('wd');
const path = require('path');
const fs = require('fs');
require('colors');

describe('Android Test App', function () {
  this.timeout(600000);
  let driver;
  let debugIntervalId;
  
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

    // every 10 seconds print what you see, debugging Android e2e on CI    
    debugIntervalId = setInterval(() => {
        driver.source().print();
    }, 50000);
    
    const desired = {
      platformName: 'Android',
      deviceName: 'Android Emulator',
      app: path.resolve('buck-out/gen/android/app/app.apk')
    };

    return driver
      .init(desired)
      .setImplicitWaitTimeout(150000);
  });

  after(function () {
    // clearInterval(debugIntervalId);
    return driver.quit();
  });
  
  it('should have Hot Module Reloading working', function () {
    const androidAppCode = fs.readFileSync('index.android.js', 'utf-8');
    let intervalToUpdate;
    return driver.
      setImplicitWaitTimeout(5000).
      // some times app starts with red screen and ReloadJS buttons if packager was not ready
      waitForElementByXPath('//android.widget.Button[@text="Reload JS"]').
      then((elem) => {
        elem.click();
      }, (err) => {
        // ignoring if Reload JS button can't be located, then it should be all fine
      }).
      setImplicitWaitTimeout(150000).
      waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]').
      // http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU
      pressDeviceKey(82).
      elementByXPath('//android.widget.TextView[starts-with(@text, "Enable Hot Reloading")]').
      click().
      waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]').
      then(() => {
        let iteration = 0;
        // change file every 3 seconds to consider slow android emulator on CI
        intervalToUpdate = setInterval(() => {
          fs.writeFileSync('index.android.js', androidAppCode.replace('Welcome to React Native!', 'Welcome to React Native with HMR!' + iteration), 'utf-8');
        }, 3000);
      }).
      waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native with HMR!")]').
      finally(() => {
        clearInterval(intervalToUpdate);
        fs.writeFileSync('index.android.js', androidAppCode, 'utf-8');
      });
  });


  it('should have Debug In Chrome working', function () {
    const androidAppCode = fs.readFileSync('index.android.js', 'utf-8');
    // http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU
    return driver.
    waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]').
    pressDeviceKey(82).
    elementByXPath('//android.widget.TextView[starts-with(@text, "Debug")]').
    click().
    waitForElementByXPath('//android.widget.TextView[starts-with(@text, "Welcome to React Native!")]')
  });
});
