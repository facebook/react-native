const path = require('path');
const fs = require('fs');

/**
 * Find and resolve symlinks in `lookupFolder`.
 * Ignore any descendants of the paths in `ignoredRoots`.
 */
module.exports = function findSymlinksPaths(lookupFolder, ignoredRoots) {
  const timeStart = Date.now();
  const resolvedSymlinks = [];
  let n = 0;

  function findSymLinks(base) {
    const folders = fs.readdirSync(base);
    n += folders.length;

    folders.forEach(folder => {
      const visited = [];
      let symlink = path.resolve(base, folder);

      // Resolve symlinks from scoped modules.
      if (path.basename(symlink).charAt(0) === '@') {
        findSymLinks(symlink);
      }

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

        // Also find symlinks from symlinked lookupFolder.
        const modules = path.join(symlink, 'node_modules');
        if (fs.existsSync(modules) && fs.lstatSync(modules).isDirectory()) {
          findSymLinks(modules);
        }
      }
    });
  }

  findSymLinks(lookupFolder);

  const timeEnd = Date.now();
  console.log(`Scanning ${n} folders for symlinks in ${lookupFolder} (${timeEnd - timeStart}ms)`);

  return resolvedSymlinks;
};

function rootExists(roots, child) {
  return roots.some(root => isDescendant(root, child));
}

function isDescendant(root, child) {
  return root === child || child.startsWith(root + path.sep);
}
