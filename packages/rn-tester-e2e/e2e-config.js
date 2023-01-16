// utility file to extract the config for E2E testing at runtime
// for appium
const path = require('path');
let capabilities;

const android = {
  'platformName': 'Android',
  'appium:platformVersion': '',
  'appium:deviceName': '',
  'appium:app': path.join(process.cwd(), '/apps/RNTester.apk'),
  'appium:automationName': 'uiautomator2',
  'appium:newCommandTimeout': 240,
};

const ios = {
  'platformName': 'iOS',
  'appium:platformVersion': '',
  'appium:deviceName': '',
  //bundleId: 'org.reactjs.native.example.TestForE2E',
  'appium:automationName': 'XCUITest',
  'appium:app': path.join(process.cwd(), '/apps/RNTester.app'),
};

if (!process.env.E2E_DEVICE) {
  throw new Error('E2E_DEVICE environment variable is not defined');
}

if (!(process.env.E2E_DEVICE.includes('android') || process.env.E2E_DEVICE.includes('ios'))) {
  throw new Error('No e2e device configuration found');
}

if (process.env.E2E_DEVICE === 'android') {
  capabilities = android;
}

if (process.env.E2E_DEVICE === 'ios') {
  capabilities = ios;
}

export default capabilities;
