const path = require('path');

/**
 * Returns an array of dependencies that should be linked/checked.
 */
module.exports = function getProjectDependencies() {
  const pjson = require(path.join(process.cwd(), './package.json'));
  return Object.keys(pjson.dependencies || {}).filter(name => name !== 'react-native');
};
