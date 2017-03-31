const fs = require('fs');

module.exports = function revokePatch(file, patch) {
  const unpatch = patch.unpatch || patch.patch
  fs.writeFileSync(file, fs
    .readFileSync(file, 'utf8')
    .replace(unpatch, '')
  );
};
