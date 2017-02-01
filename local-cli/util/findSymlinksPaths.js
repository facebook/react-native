const path = require('path');
const fs = require('fs');

/**
 * Find and resolve symlinks in `lookupFolder`.
 * Ignore any descendants of the paths in `ignoredRoots`.
 */
module.exports = function findSymlinksPaths(lookupFolder, ignoredRoots) {
  const resolvedSymlinks = [];

  const timeStart = Date.now();
  const scannedFolderCount = _findSymlinksPaths(lookupFolder, ignoredRoots, resolvedSymlinks);
  const timeEnd = Date.now();

  console.log(`Scanning ${scannedFolderCount} folders for symlinks in ${lookupFolder} (${timeEnd - timeStart}ms)`);

  return resolvedSymlinks;
};

function _findSymlinksPaths(lookupFolder, ignoredRoots, resolvedSymlinks) {
  const folders = fs.readdirSync(lookupFolder);
  let scannedFolderCount = folders.length;

  folders.forEach(folder => {
    const folderPath = path.resolve(lookupFolder, folder);

    // Handle scope folders (e.g., "@foo") by recursing, allowing us to
    // discover symlinks like "@foo/bar". A valid package setup should not have
    // nested scopes like "@foo/@bar/baz", so the depth of recursion should be
    // limited to one level.
    if (folder.startsWith("@")) {
      scannedFolderCount += _findSymlinksPaths(folderPath, ignoredRoots, resolvedSymlinks);
    } else {
      const visited = [];

      let symlink = folderPath;
      while (fs.lstatSync(symlink).isSymbolicLink()) {
        const index = visited.indexOf(symlink);
        if (index !== -1) {
          throw Error(
            `Infinite symlink recursion detected:\n  ` +
              visited.slice(index).join(`\n  `)
          );
        }

        visited.push(symlink);
        symlink = path.resolve(
          path.dirname(symlink),
          fs.readlinkSync(symlink)
        );
      }

      if (visited.length && !rootExists(ignoredRoots, symlink)) {
        resolvedSymlinks.push(symlink);
      }
    }
  });

  return scannedFolderCount;
}

function rootExists(roots, child) {
  return roots.some(root => isDescendant(root, child));
}

function isDescendant(root, child) {
  return root === child || child.startsWith(root + path.sep);
}
