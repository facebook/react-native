const fs = require('fs-extra');

exports.readFile = (file) =>
  () => fs.readFileSync(file, 'utf8');

exports.writeFile = (file, content) => content ?
  fs.writeFileSync(file, content, 'utf8') :
  (c) => fs.writeFileSync(file, c, 'utf8');
