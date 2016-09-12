const path = require('path');
const fs = require('fs');

function isSubPathOfPath(parentPath, subPath) {
  return !path.relative(parentPath, subPath).startsWith('..' + path.sep);
}

function isSubPathOfPaths(parentPaths, subPath) {
  return parentPaths.some(parentPath => isSubPathOfPath(parentPath, subPath));
}

/**
 * Find and resolve symlinks in `lookupFolder`, filtering out any
 * paths that are subpaths of `existingSearchPaths`.
 */
module.exports = function findSymlinksPaths(lookupFolder, existingSearchPaths) {
  const timeStart = Date.now();
  const folders = fs.readdirSync(lookupFolder);
  const resolvedSymlinks = folders.map(folder => path.resolve(lookupFolder, folder))
    .filter(folderPath => fs.lstatSync(folderPath).isSymbolicLink())
    .map(symlink => path.resolve(process.cwd(), fs.readlinkSync(symlink)))
    .filter(symlinkPath => !isSubPathOfPaths(existingSearchPaths, symlinkPath));
  const timeEnd = Date.now();

  console.log(`Scanning ${folders.length} folders for symlinks in ${lookupFolder} (${timeEnd - timeStart}ms)`);

  return resolvedSymlinks;
};
