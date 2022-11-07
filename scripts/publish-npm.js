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
 * This script prepares a release version of react-native and may publish to NPM.
 * It is supposed to run in CI environment, not on a developer's machine.
 *
 * To make it easier for developers it uses some logic to identify with which
 * version to publish the package.
 *
 * To cut a branch (and release RC):
 * - Developer: `git checkout -b 0.XY-stable`
 * - Developer: `./scripts/bump-oss-version.js -v v0.XY.0-rc.0`
 * - CI: test and deploy to npm (run this script) with version `0.XY.0-rc.0`
 *   with tag "next"
 *
 * To update RC release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `./scripts/bump-oss-version.js -v v0.XY.0-rc.1`
 * - CI: test and deploy to npm (run this script) with version `0.XY.0-rc.1`
 *   with tag "next"
 *
 * To publish a release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `./scripts/bump-oss-version.js -v v0.XY.0`
 * - CI: test and deploy to npm (run this script) with version `0.XY.0`
 *   and no tag ("latest" is implied by npm)
 *
 * To patch old release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag v0.XY.Z`
 * - Developer: `git push` to git@github.com:facebook/react-native.git (or merge as pull request)
 * - CI: test and deploy to npm (run this script) with version 0.XY.Z with no tag, npm will not mark it as latest if
 * there is a version higher than XY
 *
 * Important tags:
 * If tag v0.XY.0-rc.Z is present on the commit then publish to npm with version 0.XY.0-rc.Z and tag next
 * If tag v0.XY.Z is present on the commit then publish to npm with version 0.XY.Z and no tag (npm will consider it latest)
 */

const {exec, echo, exit, test} = require('shelljs');
const yargs = require('yargs');
const {parseVersion} = require('./version-utils');

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
  }).argv;
const nightlyBuild = argv.nightly;
const dryRunBuild = argv.dryRun;

// 34c034298dc9cad5a4553964a5a324450fda0385
const currentCommit = exec('git rev-parse HEAD', {
  silent: true,
}).stdout.trim();
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
  ({version, major, minor, prerelease} = parseVersion(rawVersion));
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
// For stable, pre-release releases, we manually call bump-oss-version on release branch
if (nightlyBuild || dryRunBuild) {
  if (
    exec(
      `node scripts/bump-oss-version.js --nightly --to-version ${releaseVersion}`,
    ).code
  ) {
    echo('Failed to bump version number');
    exit(1);
  }
}

// -------- Generating Android Artifacts with JavaDoc
if (exec('./gradlew :ReactAndroid:installArchives').code) {
  echo('Could not generate artifacts');
  exit(1);
}

// undo uncommenting javadoc setting
exec('git checkout ReactAndroid/gradle.properties');

echo('Generated artifacts for Maven');

let artifacts = ['-javadoc.jar', '-sources.jar', '.aar', '.pom'].map(suffix => {
  return `react-native-${releaseVersion}${suffix}`;
});

artifacts.forEach((name) => {
  if (
    !test(
      '-e',
      `./android/com/facebook/react/react-native/${releaseVersion}/${name}`,
    )
  ) {
    echo(`file ${name} was not generated`);
    exit(1);
  }
});

if (dryRunBuild) {
  echo('Skipping `npm publish` because --dry-run is set.');
  exit(0);
}

// Running to see if this commit has been git tagged as `latest`
const latestCommit = exec("git rev-list -n 1 'latest'", {
  silent: true,
}).stdout.replace('\n', '');
const isLatest = currentCommit === latestCommit;

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
