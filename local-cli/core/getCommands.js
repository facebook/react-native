const path = require('path');
const findPlugins = require('./findPlugins');
const flatten = require('lodash').flatten;

/**
 * @return {Array} Array of commands
 */
module.exports = function getCommands() {
  const appRoot = process.cwd();
  const plugins = findPlugins([appRoot]).map(name => require(path.join(appRoot, 'node_modules', name)));
  return flatten(plugins);
};
