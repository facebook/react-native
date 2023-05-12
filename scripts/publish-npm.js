/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

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

if (require.main === module) {
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

  const buildType = argv.release
    ? 'release'
    : argv.nightly
    ? 'nightly'
    : 'dry-run';

  publishNpm(buildType);
}

// Get `next` version from npm and +1 on the minor for `main` version
function getMainVersion() {
  const cmd = 'npm view react-native dist-tags.next';
  echo(cmd);
  const result = exec(cmd);
  if (result.code) {
    throw 'Failed to get next version from npm';
  }
  const {major, minor} = parseVersion(result.stdout.trim(), 'release');
  return `${major}.${parseInt(minor, 10) + 1}.0`;
}

function getNpmInfo(buildType) {
  const currentCommit = getCurrentCommit();
  const shortCommit = currentCommit.slice(0, 9);

  if (buildType === 'dry-run') {
    return {
      version: `1000.0.0-${shortCommit}`,
      tag: null, // We never end up publishing this
    };
  }

  if (buildType === 'nightly') {
    const mainVersion = getMainVersion();
    const dateIdentifier = new Date()
      .toISOString()
      .slice(0, -14)
      .replace(/[-]/g, '');
    return {
      version: `${mainVersion}-nightly-${dateIdentifier}-${shortCommit}`,
      tag: 'nightly',
    };
  }

  const {version, major, minor, prerelease} = parseVersion(
    process.env.CIRCLE_TAG,
    buildType,
  );

  // See if releaser indicated that this version should be tagged "latest"
  // Set in `bump-oss-version`
  const isLatest = exitIfNotOnGit(
    () => isTaggedLatest(currentCommit),
    'Not in git. We do not want to publish anything',
  );

  const releaseBranchTag = `${major}.${minor}-stable`;

  // npm will automatically tag the version as `latest` if no tag is set when we publish
  // To prevent this, use `releaseBranchTag` when we don't want that (ex. releasing a patch on older release)
  const tag =
    prerelease != null ? 'next' : isLatest ? 'latest' : releaseBranchTag;

  return {
    version,
    tag,
  };
}

function publishNpm(buildType) {
  const {version, tag} = getNpmInfo(buildType);

  // Set version number in various files (package.json, gradle.properties etc)
  // For non-nightly, non-dry-run, CircleCI job `prepare_package_for_release` does this
  if (buildType === 'nightly' || buildType === 'dry-run') {
    if (
      exec(
        `node scripts/set-rn-version.js --to-version ${version} --build-type ${buildType}`,
      ).code
    ) {
      echo(`Failed to set version number to ${version}`);
      return exit(1);
    }
  }

  generateAndroidArtifacts(version);

  // Write version number to the build folder
  const versionFile = path.join('build', '.version');
  fs.writeFileSync(versionFile, version);

  if (buildType === 'dry-run') {
    echo('Skipping `npm publish` because --dry-run is set.');
    return exit(0);
  }

  // We first publish on Maven Central all the necessary artifacts.
  // NPM publishing is done just after.
  publishAndroidArtifactsToMaven(version, buildType === 'nightly');

  const tagFlag = `--tag ${tag}`;
  const otp = process.env.NPM_CONFIG_OTP;
  const otpFlag = otp ? ` --otp ${otp}` : '';

  const packageDirPath = path.join(__dirname, '..', 'packages', 'react-native');
  if (exec(`npm publish ${tagFlag}${otpFlag}`, {cwd: packageDirPath}).code) {
    echo('Failed to publish package to npm');
    return exit(1);
  } else {
    echo(`Published to npm ${version}`);
    return exit(0);
  }
}

module.exports = publishNpm;
