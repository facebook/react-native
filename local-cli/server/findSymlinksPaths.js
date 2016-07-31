const path = require('path');
const fs = require('fs');

module.exports = function findSymlinksPaths(lookupFolder) {
  const timeStart = Date.now();
  const folders = fs.readdirSync(lookupFolder);
  const timeEnd = Date.now();
  console.log(`Scanning ${folders.length} folders in ${lookupFolder} (${timeEnd - timeStart}ms)`);

  return folders.map(folder => path.resolve(lookupFolder, folder))
    .filter(folderPath => fs.lstatSync(folderPath).isSymbolicLink())
    .map(symlink => path.resolve(process.cwd(), fs.readlinkSync(symlink)));
};
