// utility file to extract the config for E2E testing at runtime
// for appium
const path = require('path');
let capabilities;

const android = {
  platformName: 'Android',
  platformVersion: '13.0',
  deviceName: 'Pixel 6 API 33',
  app: path.join(process.cwd(), '/apps/rn-tester.apk'),
  automationName: 'UiAutomator2',
  newCommandTimeout: 240,
};

const ios = {
  platformName: 'iOS',
  platformVersion: '15.5',
  deviceName: 'iPhone 13',
  bundleId: 'org.reactjs.native.example.TestForE2E',
  automationName: 'XCUITest',
};

if (!process.env.E2E_DEVICE) {
  throw new Error('E2E_DEVICE environment variable is not defined');
}

if (![process.env.E2E_DEVICE].includes('android' || 'ios')) {
  throw new Error(
    'No e2e device configuration found.',
  );
}

if (process.env.E2E_DEVICE === 'android') {
  capabilities = android;
}

if (process.env.E2E_DEVICE === 'ios') {
  capabilities = ios;
}

export default capabilities;
