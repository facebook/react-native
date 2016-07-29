const path = require('path');
const fs = require('fs');

module.exports = function findSymlinksPaths(lookupFolder) {
  return fs.readdirSync(lookupFolder)
    .map(file => path.resolve(lookupFolder, file))
    .filter(filePath => fs.lstatSync(filePath).isSymbolicLink())
    .map(symlink => path.resolve(process.cwd(), fs.readlinkSync(symlink)));
};
