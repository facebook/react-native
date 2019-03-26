/** @format */

const android = require('./android');
const ios = require('./ios');

const flat = {
  android: android.valid,
  ios: ios.valid,
  Podfile: 'empty',
};

const nested = {
  android: {
    app: android.valid,
  },
  ios: ios.valid,
};

const withExamples = {
  Examples: flat,
  ios: ios.valid,
  android: android.valid,
};

const withPods = {
  Podfile: 'content',
  ios: ios.pod,
};

module.exports = {flat, nested, withExamples, withPods};
