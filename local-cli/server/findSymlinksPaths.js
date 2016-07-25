const path = require('path');
const fs = require('fs');

module.exports = function findSymlinksPaths(lookupFolder) {
  return fs.readdirSync(lookupFolder)
    .map(f => path.resolve(lookupFolder, f))
    .filter(d => fs.lstatSync(d).isSymbolicLink())
    .map(s => path.resolve(process.cwd(), fs.readlinkSync(s)));
};
