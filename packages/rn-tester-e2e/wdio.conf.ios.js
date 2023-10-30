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

exports.config = {
    runner: 'local',
    path: '/',
    
    specs: [
        './tests/specs/components/**/*.test.js'
    ],
    exclude: [
    ],
    
    maxInstances: 1,
    
    capabilities: [{ 
      platformName: 'iOS',
      'appium:platformVersion': '17.0',
      'appium:deviceName': 'iPhone 15',
      'appium:automationName': 'XCUITest',
      'appium:app': path.join(process.cwd(), '/apps/rn-tester.app'),
    }],
    logLevel: 'info',
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
              port: 4723
            },
            logPath: './reports',
          }
        ]
      ],
    reporters: ['spec'],
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        require: ['@babel/register']
    },

    afterTest: async function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            await driver.takeScreenshot();
        }
    },

};
