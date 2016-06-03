const path = require('path');
const findPlugins = require('./findPlugins');

/**
 * @return {Array} Array of commands
 */
module.exports = function getCommands() {
  const appRoot = process.cwd();

  return findPlugins([appRoot]).map(name => require(path.join(appRoot, 'node_modules', name)));
};
