/** @format */

module.exports = function normalizeProjectName(name) {
  return name.replace(/\//g, '_');
};
