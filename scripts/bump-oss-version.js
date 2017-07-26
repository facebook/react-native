#!/usr/bin/env node
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
 * It updates the version in json/gradle files and makes sure they are consistent between each other
 * After changing the files it makes a commit and tags it.
 * All you have to do is push changes to remote and CI will make a new build.
 */

const {
  cat,
  echo,
  exec,
  exit,
  sed,
} = require('shelljs');

const minimist = require('minimist');

let argv = minimist(process.argv.slice(2), {
  alias: {remote: 'r'},
  default: {remote: 'origin'},
});

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
let version = argv._[0];
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

// verify that files changed, we just do a git diff and check how many times version is added across files
let numberOfChangedLinesWithNewVersion = exec(`git diff -U0 | grep '^[+]' | grep -c ${version} `, {silent: true})
  .stdout.trim();
if (+numberOfChangedLinesWithNewVersion !== 2) {
  echo(`Failed to update all the files. package.json and gradle.properties must have versions in them`);
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

// Push newly created tag
let remote = argv.remote;
exec(`git push ${remote} v${version}`);

// Tag latest if doing stable release
if (version.indexOf(`rc`) === -1) {
  exec(`git tag -d latest`);
  exec(`git push ${remote} :latest`);
  exec(`git tag latest`);
  exec(`git push ${remote} latest`);
}

exec(`git push ${remote} ${branch} --follow-tags`);

exit(0);
