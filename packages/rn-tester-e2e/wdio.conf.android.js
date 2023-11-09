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
      platformName: 'Android',
      'appium:platformVersion': '14.0',
      'appium:deviceName': 'Android Emulator',
      'appium:app': path.join(process.cwd(), '/apps/rn-tester.apk'),
      'appium:automationName': 'UiAutomator2',
      'appium:newCommandTimeout': 240,
    },
  ],
  logLevel: 'debug',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  specFileRetries: 2,
  services: [
    [
      'appium',
      {
        args: {
          address: 'localhost',
          port: 4723,
        },
        logPath: './reports',
      },
    ],
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    bail: true,
    ui: 'bdd',
    timeout: 40000,
    require: ['@babel/register'],
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
      await driver.takeScreenshot(filePath);
    }
  },
};
