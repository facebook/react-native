const execSync = require('child_process').execSync;
const path = require('path');

module.exports = function findSymlinksPaths(lookupFolder) {
  let symlinks = execSync('readlink $(find ' + lookupFolder + ' -type l -d 1)')
    .toString()
    .split('\n');

  symlinks.pop();

  return symlinks.map(s => path.resolve(process.cwd(), s));
};
