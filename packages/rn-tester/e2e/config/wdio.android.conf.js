const{ join } = require('path');
const {config} = require('./wdio.conf');

// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
    {
        // The defaults you need to have in your config
        platformName: 'Android',
        maxInstances: 1,
        // For W3C the appium capabilities need to have an extension prefix
        // http://appium.io/docs/en/writing-running-appium/caps/
        // This is `appium:` for all Appium Capabilities which can be found here
        'appium:deviceName': 'Pixel_3a_API_33_x86_64',
        'appium:platformVersion': '13.0',
        'appium:orientation': 'PORTRAIT',
        'appium:automationName': 'UiAutomator2',
        // The path to the app
        'appium:app': join(process.cwd(), './apps/rn-tester.apk'),
        'appium:newCommandTimeout': 240,
    },
];

exports.config = config;
