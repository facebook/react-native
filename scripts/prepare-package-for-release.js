/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script prepares a release package to be pushed to npm
 * It is triggered to run on CircleCI
 * It will:
 *    * It updates the version in json/gradle files and makes sure they are consistent between each other (set-rn-version)
 *    * Updates podfile for RNTester
 *    * Commits changes and tags with the next version based off of last version tag.
 *      This in turn will trigger another CircleCI job to publish to npm
 */
const {echo, exec, exit} = require('shelljs');
const yargs = require('yargs');
const {isReleaseBranch, parseVersion} = require('./version-utils');
const {failIfTagExists} = require('./release-utils');

const argv = yargs
  .option('r', {
    alias: 'remote',
    default: 'origin',
  })
  .option('v', {
    alias: 'to-version',
    type: 'string',
    required: true,
  })
  .option('l', {
    alias: 'latest',
    type: 'boolean',
    default: false,
  })
  .option('d', {
    alias: 'dry-run',
    type: 'boolean',
    default: false,
  }).argv;

const branch = process.env.CIRCLE_BRANCH;
const remote = argv.remote;
const releaseVersion = argv.toVersion;
const isLatest = argv.latest;
const isDryRun = argv.dryRun;

const buildType = isDryRun
  ? 'dry-run'
  : isReleaseBranch(branch)
  ? 'release'
  : 'nightly';

failIfTagExists(releaseVersion, buildType);

if (branch && !isReleaseBranch(branch) && !isDryRun) {
  console.error(`This needs to be on a release branch. On branch: ${branch}`);
  exit(1);
} else if (!branch && !isDryRun) {
  console.error('This needs to be on a release branch.');
  exit(1);
}

const {version} = parseVersion(releaseVersion, buildType);
if (version == null) {
  console.error(`Invalid version provided: ${releaseVersion}`);
  exit(1);
}

if (
  exec(
    `node scripts/set-rn-version.js --to-version ${version} --build-type ${buildType}`,
  ).code
) {
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

echo(`Local checkout has been prepared for release version ${version}.`);
if (isDryRun) {
  echo('Changes will not be committed because --dry-run was set to true.');
  exit(0);
}

// Make commit [0.21.0-rc] Bump version numbers
if (exec(`git commit -a -m "[${version}] Bump version numbers"`).code) {
  echo('failed to commit');
  exit(1);
}

// Add tag v0.21.0-rc.1
if (exec(`git tag -a v${version} -m "v${version}"`).code) {
  echo(
    `failed to tag the commit with v${version}, are you sure this release wasn't made earlier?`,
  );
  echo('You may want to rollback the last commit');
  echo('git reset --hard HEAD~1');
  exit(1);
}

// If `isLatest`, this git tag will also set npm release as `latest`
if (isLatest) {
  exec('git tag -d latest');
  exec(`git push ${remote} :latest`);

  // This will be pushed with the `--follow-tags`
  exec('git tag -a latest -m "latest"');
}

exec(`git push ${remote} ${branch} --follow-tags`);

exit(0);
