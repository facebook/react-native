// @ts-check
const fs = require("fs");
const path = require("path");
const semver = require('semver');
const {gatherVersionInfo} = require('./versionUtils');

function getNextVersion(patchVersionPrefix) {

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

    return {releaseVersion, branchVersionSuffix};
}

const nextVersion = getNextVersion().releaseVersion;
console.log(nextVersion);