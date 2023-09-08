// @ts-check
const fs = require("fs");
const path = require("path");
const semver = require('semver');
const {execSync} = require('child_process');

const pkgJsonPath = path.resolve(__dirname, "../packages/react-native/package.json");
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

module.exports = {
    gatherVersionInfo,
    publishBranchName,
    pkgJsonPath,
}