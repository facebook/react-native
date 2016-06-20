const mapHeaderSearchPaths = require('./mapHeaderSearchPaths');

module.exports = function addToHeaderSearchPaths(project, path) {
  mapHeaderSearchPaths(project, searchPaths => searchPaths.concat(path));
};
