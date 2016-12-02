const fs = require('fs');

module.exports = function applyPatch(file, patch, flip = false) {

  fs.writeFileSync(file, fs
    .readFileSync(file, 'utf8')
    .replace(patch.pattern, match => {
      return flip ? `${patch.patch}${match}` : `${match}${patch.patch}`
    })
  );
};
