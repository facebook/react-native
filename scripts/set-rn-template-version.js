const fs = require('fs');
const {cat} = require('shelljs');

const version = process.argv[2];

if (!version) {
  console.error('You need to provide react-native version');
  process.exit(1);
}

let templatePackageJson = JSON.parse(cat('template/package.json'));
templatePackageJson.dependencies['react-native'] = version;
fs.writeFileSync('./template/package.json', JSON.stringify(templatePackageJson, null, 2) + '\n', 'utf-8');
