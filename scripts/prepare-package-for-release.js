/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script prepares a release package to be pushed to npm
 * It will:
 *    * It updates the version in json/gradle files and makes sure they are consistent between each other (set-rn-version)
 *    * Updates podfile for RNTester
 *    * Commits changes and tags with the next version based off of last version tag.
 *      This in turn will trigger another CircleCI job to publish to npm
 */
const {echo, exec, exit} = require('shelljs');
const yargs = require('yargs');
const {
  isReleaseBranch,
  isTaggedLatest,
  getNextVersionFromTags,
} = require('./version-utils');

const branch = process.env.CIRCLE_BRANCH;
const currentCommit = process.env.CIRCLE_SHA1;

const argv = yargs.option('r', {
  alias: 'remote',
  default: 'origin',
}).argv;

if (!isReleaseBranch(branch)) {
  console.error('This needs to be on a release branch');
  exit(1);
}

// Progress the version by 1 using existing git tags
const {version} = getNextVersionFromTags(branch);

if (exec(`node scripts/set-rn-version.js --to-version ${version}`).code) {
  echo(`Failed to set React Native version to ${version}`);
  exit(1);
}

// Release builds should commit the version bumps, and create tags.
echo('Updating RNTester Podfile.lock...');
if (exec('source scripts/update_podfile_lock.sh && update_pods').code) {
  echo('Failed to update RNTester Podfile.lock.');
  echo('Fix the issue, revert and try again.');
  exit(1);
}

// Check if this release has been tagged as latest
const isLatest = isTaggedLatest(currentCommit);

// Make commit [0.21.0-rc] Bump version numbers
if (exec(`git commit -a -m "[${version}] Bump version numbers"`).code) {
  echo('failed to commit');
  exit(1);
}

// Since we just committed, if `isLatest`, move the tag to commit we just made
// This tag will also update npm release as `latest`
if (isLatest) {
  exec('git tag -d latest');
  exec(`git push ${remote} :latest`);
  exec('git tag latest');
  exec(`git push ${remote} latest`);
}

// Add tag v0.21.0-rc.1
if (exec(`git tag v${version}`).code) {
  echo(
    `failed to tag the commit with v${version}, are you sure this release wasn't made earlier?`,
  );
  echo('You may want to rollback the last commit');
  echo('git reset --hard HEAD~1');
  exit(1);
}

// Push newly created tag
let remote = argv.remote;
exec(`git push ${remote} v${version}`);

exec(`git push ${remote} ${branch} --follow-tags`);

exit(0);
