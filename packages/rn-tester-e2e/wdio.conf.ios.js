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
    services: [
        [
          'appium',
          {
            args: {
              address: 'localhost',
              port: 4723
            },
          }
        ]
      ],
    
    reporters: ['spec'],
    framework: 'mocha',
    mochaOpts: {
        retries: 4,
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
