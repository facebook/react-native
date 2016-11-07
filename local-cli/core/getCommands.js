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
    .map(pathToCommands => {
      const name = pathToCommands.split(path.sep)[0];

      return attachPackage(
        require(path.join(appRoot, 'node_modules', pathToCommands)),
        require(path.join(appRoot, 'node_modules', name, 'package.json'))
      );
    });

  return flatten(plugins);
};
