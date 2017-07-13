const fs = require('fs');
const makeBuildPatch = require('./patches/makeBuildPatch');

module.exports = function isInstalled(config, name) {
  const buildGradle = fs.readFileSync(config.buildGradlePath);
  return makeBuildPatch(name).installPattern.test(buildGradle);
};
