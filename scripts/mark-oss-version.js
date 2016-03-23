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
 * This script marks a new version for open source releases.
 * It updates the version in podspec/json/gradle files and makes sure they are consistent between each other
 * After changing the files it makes a commit and tags it.
 * All you have to do is push changes to remote and CI will make a new build.
 */
/*eslint-disable no-undef */
require(`shelljs/global`);

// - check we are in release branch
let branch = exec(`git symbolic-ref --short HEAD`, {silent: true}).stdout.trim();

exit(0)
// - check that argument version matches branch
// - change package.json
// - change ReactAndroid/gradle.properties
// - change React.podspec
// - make commit [0.21.0-rc] Bump version numbers
// - add tag v0.21.0-rc
// - change Releases.md to reflect changes in this file

// Uncomment Javadoc generation
if (sed(`-i`, `// archives androidJavadocJar`, `archives androidJavadocJar`, `ReactAndroid/release.gradle`).code) {
  echo(`Couldn't enable Javadoc generation`);
  exit(1);
}

// gradle version
if (sed(`-i`, /^VERSION_NAME=[0-9\.]*-SNAPSHOT/, `VERSION_NAME=${releaseVersion}`, `ReactAndroid/gradle.properties`).code) {
  echo(`Couldn't update version for Gradle`);
  exit(1);
}

if (exec(`npm version --no-git-tag-version ${releaseVersion}`).code) {
  echo(`Couldn't update version for npm`);
  exit(1);
}
if (sed(`-i`, `s.version             = "0.0.1-master"`, `s.version             = \"${releaseVersion}\"`, `React.podspec`).code) {
  echo(`Couldn't update version for React.podspec`);
  exit(1);
}


exit(0);
/*eslint-enable no-undef */
