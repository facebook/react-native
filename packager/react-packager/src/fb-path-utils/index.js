var absolutePath = require('absolute-path');
var path = require('path');
var pathIsInside = require('path-is-inside');

function isAbsolutePath(pathStr) {
  return absolutePath(pathStr);
}

function isChildPath(parentPath, childPath) {
  return pathIsInside(parentPath, childPath);
}

exports.isAbsolutePath = isAbsolutePath;
exports.isChildPath = isChildPath;
