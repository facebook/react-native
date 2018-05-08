const isInstalledIOS = require('../isInstalled');
const isInstalledPods = require('../../pods/isInstalled');

module.exports = function isInstalled(projectConfig, name, dependencyConfig) {
  return isInstalledIOS(projectConfig, dependencyConfig) || isInstalledPods(projectConfig, dependencyConfig);
};
