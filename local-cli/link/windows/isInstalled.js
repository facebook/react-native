const fs = require('fs');
const makeUsingPatch = require('./patches/makeUsingPatch');

module.exports = function isInstalled(config, dependencyConfig) {
  return fs
    .readFileSync(config.mainFilePath)
    .indexOf(makeUsingPatch(dependencyConfig.packageUsingPath).patch) > -1;
};
