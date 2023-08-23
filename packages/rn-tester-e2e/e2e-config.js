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

type Capabilities = {
  platformName: 'Android' | 'iOS',
  'appium:platformVersion': string,
  'appium:deviceName': string,
  'appium:app': string,
  'appium:automationName': 'UiAutomator2' | 'XCUITest',
  'appium:newCommandTimeout'?: number,
};

let capabilities: Capabilities;

const android = {
  platformName: 'Android',
  'appium:platformVersion': '14.0',
  'appium:deviceName': 'Android Emulator',
  'appium:app': path.join(process.cwd(), '/apps/rn-tester.apk'),
  'appium:automationName': 'UiAutomator2',
  'appium:newCommandTimeout': 240,
};

const ios = {
  platformName: 'iOS',
  'appium:platformVersion': '16.4',
  'appium:deviceName': 'iPhone 14',
  'appium:automationName': 'XCUITest',
  'appium:app': path.join(process.cwd(), '/apps/rn-tester.app'),
};

// check that E2E_DEVICE exists, is a string and its either "ios" or "android"
if (!process.env.E2E_DEVICE) {
  throw new Error('E2E_DEVICE environment variable is not defined');
} else if (typeof process.env.E2E_DEVICE !== 'string') {
  throw new Error('E2E_DEVICE environment variable is not a string');
} else if (
  process.env.E2E_DEVICE !== 'ios' &&
  process.env.E2E_DEVICE !== 'android'
) {
  throw new Error('E2E_DEVICE environment variable is not "ios" or "android"');
}

if (process.env.E2E_DEVICE === 'android') {
  capabilities = android;
}

if (process.env.E2E_DEVICE === 'ios') {
  capabilities = ios;
}

export default capabilities;
