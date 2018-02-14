/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const fs = require('fs');

/**
 * Find and resolve symlinks in `lookupFolder`.
 * Ignore any descendants of the paths in `ignoredRoots`.
 */
module.exports = function findSymlinksPaths(lookupFolder, ignoredRoots) {
  const timeStart = Date.now();
  const folders = fs.readdirSync(lookupFolder);

  const resolvedSymlinks = [];
  folders.forEach(folder => {
    const visited = [];

    let symlink = path.resolve(lookupFolder, folder);
    while (fs.lstatSync(symlink).isSymbolicLink()) {
      const index = visited.indexOf(symlink);
      if (index !== -1) {
        throw Error(
          'Infinite symlink recursion detected:\n  ' +
            visited.slice(index).join('\n  ')
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
  });

  const timeEnd = Date.now();
  console.log(`Scanning ${folders.length} folders for symlinks in ${lookupFolder} (${timeEnd - timeStart}ms)`);

  return resolvedSymlinks;
};

function rootExists(roots, child) {
  return roots.some(root => isDescendant(root, child));
}

function isDescendant(root, child) {
  return root === child || child.startsWith(root + path.sep);
}
