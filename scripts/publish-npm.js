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
 * This script prepares a release version of react-native and may publish to NPM.
 * It is supposed to run in CI environment, not on a developer's machine.
 *
 * For a dry run (commitly), this script will:
 *  * Version the commitly of the form `1000.0.0-<commitSha>`
 *  * Create Android artifacts
 *  * It will not publish to npm
 *
 * For a nightly run, this script will:
 *  * Version the nightly release of the form `0.0.0-<dateIdentifier>-<commitSha>`
 *  * Create Android artifacts
 *  * Publish to npm using `nightly` tag
 *
 * For a release run, this script will:
 *  * Version the release by the tag version that triggered CI
 *  * Create Android artifacts
 *  * Publish to npm
 *     * using `latest` tag if commit is currently tagged `latest`
 *     * or otherwise `{major}.{minor}-stable`
 */

const {exec, echo, exit} = require('shelljs');
const {parseVersion} = require('./version-utils');
const {
  exitIfNotOnGit,
  getCurrentCommit,
  isTaggedLatest,
} = require('./scm-utils');
const {
  generateAndroidArtifacts,
  publishAndroidArtifactsToMaven,
} = require('./release-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const buildTag = process.env.CIRCLE_TAG;
const otp = process.env.NPM_CONFIG_OTP;

const argv = yargs
  .option('n', {
    alias: 'nightly',
    type: 'boolean',
    default: false,
  })
  .option('d', {
    alias: 'dry-run',
    type: 'boolean',
    default: false,
  })
  .option('r', {
    alias: 'release',
    type: 'boolean',
    default: false,
  })
  .strict().argv;
const nightlyBuild = argv.nightly;
const dryRunBuild = argv.dryRun;
const releaseBuild = argv.release;
const isCommitly = nightlyBuild || dryRunBuild;

const buildType = releaseBuild
  ? 'release'
  : nightlyBuild
  ? 'nightly'
  : 'dry-run';

// 34c034298dc9cad5a4553964a5a324450fda0385
const currentCommit = getCurrentCommit();
const shortCommit = currentCommit.slice(0, 9);

const rawVersion =
  // 0.0.0 triggers issues with cocoapods for codegen when building template project.
  dryRunBuild
    ? '1000.0.0'
    : // For nightly we continue to use 0.0.0 for clarity for npm
    nightlyBuild
    ? '0.0.0'
    : // For pre-release and stable releases, we use the git tag of the version we're releasing (set in bump-oss-version)
      buildTag;

let version,
  major,
  minor,
  prerelease = null;
try {
  ({version, major, minor, prerelease} = parseVersion(rawVersion, buildType));
} catch (e) {
  echo(e.message);
  exit(1);
}

let releaseVersion;
if (dryRunBuild) {
  releaseVersion = `${version}-${shortCommit}`;
} else if (nightlyBuild) {
  // 2021-09-28T05:38:40.669Z -> 20210928-0538
  const dateIdentifier = new Date()
    .toISOString()
    .slice(0, -8)
    .replace(/[-:]/g, '')
    .replace(/[T]/g, '-');
  releaseVersion = `${version}-${dateIdentifier}-${shortCommit}`;
} else {
  releaseVersion = version;
}

// Bump version number in various files (package.json, gradle.properties etc)
// For stable, pre-release releases, we rely on CircleCI job `prepare_package_for_release` to handle this
if (isCommitly) {
  if (
    exec(
      `node scripts/set-rn-version.js --to-version ${releaseVersion} --build-type ${buildType}`,
    ).code
  ) {
    echo(`Failed to set version number to ${releaseVersion}`);
    exit(1);
  }
}

generateAndroidArtifacts(releaseVersion);

// Write version number to the build folder
const releaseVersionFile = path.join('build', '.version');
fs.writeFileSync(releaseVersionFile, releaseVersion);

if (dryRunBuild) {
  echo('Skipping `npm publish` because --dry-run is set.');
  exit(0);
}

// Running to see if this commit has been git tagged as `latest`
const isLatest = exitIfNotOnGit(
  () => isTaggedLatest(currentCommit),
  'Not in git. We do not want to publish anything',
);

// We first publish on Maven Central all the necessary artifacts.
// NPM publishing is done just after.
publishAndroidArtifactsToMaven(releaseVersion, nightlyBuild);

const releaseBranch = `${major}.${minor}-stable`;

// Set the right tag for nightly and prerelease builds
// If a release is not git-tagged as `latest` we use `releaseBranch` to prevent
// npm from overriding the current `latest` version tag, which it will do if no tag is set.
const tagFlag = nightlyBuild
  ? '--tag nightly'
  : prerelease != null
  ? '--tag next'
  : isLatest
  ? '--tag latest'
  : `--tag ${releaseBranch}`;

// use otp from envvars if available
const otpFlag = otp ? `--otp ${otp}` : '';

if (exec(`npm publish ${tagFlag} ${otpFlag}`).code) {
  echo('Failed to publish package to npm');
  exit(1);
} else {
  echo(`Published to npm ${releaseVersion}`);
  exit(0);
}
