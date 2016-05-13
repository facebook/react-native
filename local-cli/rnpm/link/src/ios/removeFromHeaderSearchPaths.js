const mapHeaderSearchPaths = require('./mapHeaderSearchPaths');

/**
 * Given Xcode project and absolute path, it makes sure there are no headers referring to it
 */
module.exports = function addToHeaderSearchPaths(project, path) {
  mapHeaderSearchPaths(project,
    searchPaths => searchPaths.filter(searchPath => searchPath !== path)
  );
};
