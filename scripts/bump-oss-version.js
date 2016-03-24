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
let version = process.argv[2];
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

// verify that files changed, we just do a git diff and check how many times version is added across files
let numberOfChangedLinesWithNewVersion = exec(`git diff -U0 | grep '^[+]' | grep -c ${version} `, {silent: true})
  .stdout.trim();
if (+numberOfChangedLinesWithNewVersion !== 3) {
  echo(`Failed to update all the files. React.podspec, package.json and gradle.properties must have versions in them`);
  echo(`Fix the issue, revert and try again`);
  exec(`git diff`);
  exit(1);
}

// - make commit [0.21.0-rc] Bump version numbers
if (exec(`git commit -a -m "[${version}] Bump version numbers"`).code) {
  echo(`failed to commit`);
  exit(1);
}

// - add tag v0.21.0-rc
if (exec(`git tag v${version}`).code) {
  echo(`failed to tag the commit with v${version}, are you sure this release wasn't made earlier?`);
  echo(`You may want to rollback the last commit`);
  echo(`git reset --hard HEAD~1`);
  exit(1);
}

exit(0);
/*eslint-enable no-undef */
