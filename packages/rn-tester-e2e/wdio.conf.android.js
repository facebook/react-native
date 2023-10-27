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
        platformName: 'Android',
        'appium:platformVersion': '14.0',
        'appium:deviceName': 'Android Emulator',
        'appium:app': path.join(process.cwd(), '/apps/rn-tester.apk'),
        'appium:automationName': 'UiAutomator2',
        'appium:newCommandTimeout': 240,
    }],


    logLevel: 'debug',

    bail: 0,

    waitforTimeout: 20000,

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
            // logPath: './'
        }
        ]
    ],

    framework: 'mocha',
    reporters: ['spec'],
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
