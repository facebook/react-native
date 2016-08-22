const path = require('path');
const findPlugins = require('./findPlugins');
const flatten = require('lodash').flatten;

const attachPackage = (command, pkg) => Array.isArray(command)
  ? command.map(cmd => attachPackage(cmd, pkg))
  : { ...command, pkg };

/**
 * @return {Array} Array of commands
 */
module.exports = function getCommands() {
  const appRoot = process.cwd();
  const plugins = findPlugins([appRoot])
    .map(name => attachPackage(
      require(path.join(appRoot, 'node_modules', name)),
      require(path.join(appRoot, 'node_modules', name, 'package.json'))
    ));

  return flatten(plugins);
};
