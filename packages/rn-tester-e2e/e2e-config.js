/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const path = require('path');
let capabilities;

const android = {
  platformName: 'Android',
  'appium:platformVersion': '13.0',
  'appium:deviceName': 'Android Emulator',
  'appium:app': path.join(process.cwd(), '/apps/rn-tester.apk'),
  'appium:automationName': 'UiAutomator2',
  'appium:newCommandTimeout': 240,
};

const ios = {
  platformName: 'iOS',
  'appium:platformVersion': '16.2',
  'appium:deviceName': 'iPhone 14',
  'appium:automationName': 'XCUITest',
  'appium:app': path.join(process.cwd(), '/apps/rn-tester.app'),
};

if (!process.env.E2E_DEVICE) {
  throw new Error('E2E_DEVICE environment variable is not defined');
}

if (
  !(
    process.env.E2E_DEVICE.includes('android') ||
    process.env.E2E_DEVICE.includes('ios')
  )
) {
  throw new Error('No e2e device configuration found');
}

if (process.env.E2E_DEVICE === 'android') {
  capabilities = android;
}

if (process.env.E2E_DEVICE === 'ios') {
  capabilities = ios;
}

export default capabilities;
