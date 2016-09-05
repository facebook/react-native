const path = require('path');
const fs = require('fs');

module.exports = function findSymlinksPaths(lookupFolder) {
  const timeStart = Date.now();
  const folders = fs.readdirSync(lookupFolder);
  const resolvedSymlinks = folders.map(folder => path.resolve(lookupFolder, folder))
    .filter(folderPath => fs.lstatSync(folderPath).isSymbolicLink())
    .map(symlink => path.resolve(process.cwd(), fs.readlinkSync(symlink)));
  const timeEnd = Date.now();

  console.log(`Scanning ${folders.length} folders for symlinks in ${lookupFolder} (${timeEnd - timeStart}ms)`);

  return resolvedSymlinks;
};
