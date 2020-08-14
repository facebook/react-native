// @ts-check
const fs = require("fs");
const path = require("path");

const pkgJsonPath = path.resolve(__dirname, "../package.json");

function updatePackageName(name) {
    let pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    pkgJson.name = name;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log(`Updating package.json to name ${name}`);
}

updatePackageName('react-native');