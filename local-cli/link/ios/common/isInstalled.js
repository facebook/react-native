const isInstalledIOS = require('../isInstalled');
const isInstalledPods = require('../../pods/isInstalled');

module.exports = function isInstalled(config, name) {
  return isInstalledIOS(config, name) || isInstalledPods(config, name);
};
