/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

const path = require('path');
const fs = require('fs');

/**
 * Find symlinked modules inside "node_modules."
 *
 * Naively, we could just perform a depth-first search of all folders in
 * node_modules, recursing when we find a symlink.
 *
 * We can be smarter than this due to our knowledge of how npm/Yarn lays out
 * "node_modules" / how tools that build on top of npm/Yarn (such as Lerna)
 * install dependencies.
 *
 * Starting from a given root node_modules folder, this algorithm will look at
 * both the top level descendants of the node_modules folder or second level
 * descendants of folders that start with "@" (which indicates a scoped
 * package). If any of those folders is a symlink, it will recurse into the
 * link, and perform the same search in the linked folder.
 *
 * The end result should be a list of all resolved module symlinks for a given
 * root.
 */
module.exports = function findSymlinkedModules(
  projectRoot: string,
  ignoredRoots?: Array<string> = [],
) {
  const timeStart = Date.now();
  const nodeModuleRoot = path.join(projectRoot, 'node_modules');
  const resolvedSymlinks = findModuleSymlinks(nodeModuleRoot, [
    ...ignoredRoots,
    projectRoot,
  ]);
  const timeEnd = Date.now();

  console.log(
    `Scanning folders for symlinks in ${nodeModuleRoot} (${timeEnd -
      timeStart}ms)`,
  );

  return resolvedSymlinks;
};

function findModuleSymlinks(
  modulesPath: string,
  ignoredPaths: Array<string> = [],
): Array<string> {
  if (!fs.existsSync(modulesPath)) {
    return [];
  }

  // Find module symlinks
  const moduleFolders = fs.readdirSync(modulesPath);
  const symlinks = moduleFolders.reduce((links, folderName) => {
    const folderPath = path.join(modulesPath, folderName);
    const maybeSymlinkPaths = [];
    if (folderName.startsWith('@')) {
      const scopedModuleFolders = fs.readdirSync(folderPath);
      maybeSymlinkPaths.push(
        ...scopedModuleFolders.map(name => path.join(folderPath, name)),
      );
    } else {
      maybeSymlinkPaths.push(folderPath);
    }
    return links.concat(resolveSymlinkPaths(maybeSymlinkPaths, ignoredPaths));
  }, []);

  // For any symlinks found, look in _that_ modules node_modules directory
  // and find any symlinked modules
  const nestedSymlinks = symlinks.reduce(
    (links, symlinkPath) =>
      links.concat(
        // We ignore any found symlinks or anything from the ignored list,
        // to prevent infinite recursion
        findModuleSymlinks(path.join(symlinkPath, 'node_modules'), [
          ...ignoredPaths,
          ...symlinks,
        ]),
      ),
    [],
  );

  return [...new Set([...symlinks, ...nestedSymlinks])];
}

function resolveSymlinkPaths(maybeSymlinkPaths, ignoredPaths) {
  return maybeSymlinkPaths.reduce((links, maybeSymlinkPath) => {
    if (fs.lstatSync(maybeSymlinkPath).isSymbolicLink()) {
      const resolved = path.resolve(
        path.dirname(maybeSymlinkPath),
        fs.readlinkSync(maybeSymlinkPath),
      );
      if (ignoredPaths.indexOf(resolved) === -1 && fs.existsSync(resolved)) {
        links.push(resolved);
      }
    }
    return links;
  }, []);
}
