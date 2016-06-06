const fs = require('fs');
const makeBuildPatch = require('./patches/makeBuildPatch');

module.exports = function isInstalled(config, name) {
  return fs
    .readFileSync(config.buildGradlePath)
    .indexOf(makeBuildPatch(name).patch) > -1;
};
