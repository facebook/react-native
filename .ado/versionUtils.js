// @ts-check
const fs = require("fs");
const path = require("path");
const semver = require('semver');
const {execSync} = require('child_process');

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

    const prerelease = semver.prerelease(releaseVersion);

    if (!prerelease) {
      if (patchVersionPrefix) {
        releaseVersion = semver.inc(releaseVersion, 'prerelease', patchVersionPrefix);
      }
      else {
      releaseVersion = semver.inc(releaseVersion, 'patch');
      }
    }

    if (prerelease) {
      releaseVersion = semver.inc(releaseVersion, 'prerelease');
      if (patchVersionPrefix) {
        releaseVersion = releaseVersion.replace(`-${prerelease[0]}.`, `-${prerelease[0]}-${patchVersionPrefix}.`);
      }
    }
 
    pkgJson.version = releaseVersion;
    console.log(`Bumping files to version ${releaseVersion}`);
    execSync(`node ./scripts/bump-oss-version.js --rnmpublish ${releaseVersion}`, {stdio: 'inherit', env: process.env});

    return {releaseVersion, branchVersionSuffix};
}

const workspaceJsonPath = path.resolve(require('os').tmpdir(), 'rnpkg.json');

function removeWorkspaceConfig() {
  let {pkgJson} = gatherVersionInfo();
  fs.writeFileSync(workspaceJsonPath, JSON.stringify(pkgJson, null, 2));
  delete pkgJson.private;
  delete pkgJson.workspaces;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  console.log(`Removing workspace config from package.json to prepare to publish.`);
}

function restoreWorkspaceConfig() {
  let pkgJson = JSON.parse(fs.readFileSync(workspaceJsonPath, "utf8"));
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  console.log(`Restoring workspace config from package.json`);
}

module.exports = {
    gatherVersionInfo,
    publishBranchName,
    pkgJsonPath,
    removeWorkspaceConfig,
    restoreWorkspaceConfig,
    updateVersionsInFiles
}