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
const fs = require('fs');

exports.config = {
  runner: 'local',
  path: '/',
  specs: ['./tests/specs/components/**/*.test.js'],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:platformVersion': '16.4',
      'appium:deviceName': 'iPhone 14',
      'appium:automationName': 'XCUITest',
      'appium:app': path.join(process.cwd(), '/apps/rn-tester.app'),
      'appium:newCommandTimeout': 120,
      'appium:fullReset': false,
    },
  ],
  logLevel: 'debug',
  bail: 3, //reduce time of failed builds
  waitforTimeout: 30000,
  connectionRetryTimeout: 50000,
  connectionRetryCount: 3,
  specFileRetries: 3,
  services: [
    [
      'appium',
      {
        port: 4723,
        logPath: './reports',
      },
    ],
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    bail: true,
    ui: 'bdd',
    timeout: 50000,
  },

  beforeSession: async function (config, capabilities, specs) {
    await fs.mkdirSync('./reports/errorShots', {recursive: true});
  },

  afterTest: async function (
    test,
    context,
    {error, result, duration, passed, retries},
  ) {
    if (!passed) {
      const fileName = encodeURIComponent(
        await test.title.replace(/\s+/g, '-'),
      );
      const filePath = './reports/errorShots/' + fileName + '.png';
      await browser.saveScreenshot(filePath);
    }
  },
};
