// @ts-check
const {pkgJsonPath} = require('./versionUtils');
const fs = require("fs");

function updatePackageName(name) {
    let pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    pkgJson.name = name;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log(`Updating package.json to name ${name}`);
}

updatePackageName('react-native');