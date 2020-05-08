// @ts-check
const fs = require("fs");
const path = require("path");

const pkgJsonPath = path.resolve(__dirname, "../package.json");
let publishBranchName = '';
try {
  publishBranchName = process.env.BUILD_SOURCEBRANCH.match(/refs\/heads\/(.*)/)[1];
} catch (error) {}

function gatherVersionInfo() {
    let pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

    let releaseVersion = pkgJson.version;
    const branchVersionSuffix = (publishBranchName.match(/(fb.*merge)|(fabric)/) ? `-${publishBranchName}` : '');

    return {pkgJson, releaseVersion, branchVersionSuffix};
}

function updateVersionsInFiles(patchVersionPrefix) {

    let {pkgJson, releaseVersion, branchVersionSuffix} = gatherVersionInfo();
  
    const versionStringRegEx = new RegExp(`(.*)(-${publishBranchName})?\\.([0-9]*)`);
    const versionGroups = versionStringRegEx.exec(releaseVersion);
    if (versionGroups) {
      releaseVersion = versionGroups[1] + patchVersionPrefix + branchVersionSuffix + '.' + (parseInt(versionGroups[3]) + 1);
    } else {
      console.log("Invalid version to publish");
      process.exit(1);
    }
  
    pkgJson.version = releaseVersion;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log(`Updating package.json to version ${releaseVersion}`);
  
    return {releaseVersion, branchVersionSuffix};
}

function updatePackageName(name) {
    let pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    pkgJson.name = name;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log(`Updating package.json to name ${name}`);
}

module.exports = {
    gatherVersionInfo,
    publishBranchName,
    pkgJsonPath,
    updateVersionsInFiles,
    updatePackageName
}