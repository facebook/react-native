const path = require('path');
const fs = require('fs');
const uniq = require('lodash').uniq;
const flattenDeep = require('lodash').flattenDeep;
const findPlugins = require('./findPlugins');

/**
 * @return {Array} Array of commands
 */
module.exports = function getCommands() {
  const rnpmRoot = path.join(__dirname, '..');
  const appRoot = process.cwd();

  return uniq(
    flattenDeep([
      findPlugins([rnpmRoot]).map(require),
      findPlugins([appRoot]).map(name => require(path.join(appRoot, 'node_modules', name))),
    ])
  , 'name');
};
