const fs = require('fs');

module.exports = function revokePatch(file, patch) {
  fs.writeFileSync(file, fs
    .readFileSync(file, 'utf8')
    .replace(patch.patch, '')
  );
};
