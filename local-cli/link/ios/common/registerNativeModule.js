/** @format */

const registerDependencyIOS = require('../registerNativeModule');
const registerDependencyPods = require('../../pods/registerNativeModule');

module.exports = function registerNativeModule(
  name,
  dependencyConfig,
  params,
  projectConfig,
) {
  if (projectConfig.podfile && dependencyConfig.podspec) {
    registerDependencyPods(name, dependencyConfig, projectConfig);
  } else {
    registerDependencyIOS(dependencyConfig, projectConfig);
  }
};
