/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * This script bumps a new version for open source releases.
 * It updates the version in podspec/json/gradle files and makes sure they are consistent between each other
 * After changing the files it makes a commit and tags it.
 * All you have to do is push changes to remote and CI will make a new build.
 */
/*eslint-disable no-undef */
require(`shelljs/global`);

// - check we are in release branch, e.g. 0.33-stable
let branch = exec(`git symbolic-ref --short HEAD`, {silent: true}).stdout.trim();

if (branch.indexOf(`-stable`) === -1) {
  echo(`You must be in 0.XX-stable branch to bump a version`);
  exit(1);
}

// e.g. 0.33
let versionMajor = branch.slice(0, branch.indexOf(`-stable`));

// - check that argument version matches branch
// e.g. 0.33.1 or 0.33.0-rc4
let version = process.argv.slice(2)[0];
if (!version || version.indexOf(versionMajor) !== 0) {
  echo(`You must pass a tag like ${versionMajor}.[X]-rc[Y] to bump a version`);
  exit(1);
}

let packageJson = JSON.parse(cat(`package.json`));
packageJson.version = version;
JSON.stringify(packageJson, null, 2).to(`package.json`);

// - change ReactAndroid/gradle.properties
if (sed(`-i`, /^VERSION_NAME=.*/, `VERSION_NAME=${version}`, `ReactAndroid/gradle.properties`).code) {
  echo(`Couldn't update version for Gradle`);
  exit(1);
}

// - change React.podspec
if (sed(`-i`, /s.version\s*=.*/, `s.version             = \"${version}\"`, `React.podspec`).code) {
  echo(`Couldn't update version for React.podspec`);
  exit(1);
}


// - make commit [0.21.0-rc] Bump version numbers
// TODO verify all cganges
// - add tag v0.21.0-rc
// - change Releases.md to reflect changes in this file





exit(0);
/*eslint-enable no-undef */
