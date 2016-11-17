const fs = require('fs');

module.exports = function applyPatch(file, patch) {
  fs.writeFileSync(file, fs
    .readFileSync(file, 'utf8')
    .replace(patch.pattern, match => `${match}${patch.patch}`)
  );
};
