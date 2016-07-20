const path = require('path');

module.exports = (folder) => require(
  path.join(folder, 'node_modules', 'react-native', 'package.json')
).version;
