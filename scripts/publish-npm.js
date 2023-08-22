/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {echo, exit} = require('shelljs');
const {publishPackage, getNpmInfo} = require('./npm-utils');
const getAndUpdateNightlies = require('./monorepo/get-and-update-nightlies');
const setReactNativeVersion = require('./set-rn-version');
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

function publishNpm(buildType) {
  const {version, tag} = getNpmInfo(buildType);

  // Here we update the react-native package and template package with the right versions
  // For releases, CircleCI job `prepare_package_for_release` handles this
  if (buildType === 'nightly' || buildType === 'dry-run') {
    // Publish monorepo nightlies if there are updates, returns nightly versions for each
    const monorepoNightlyVersions =
      buildType === 'nightly' ? getAndUpdateNightlies(version) : null;

    try {
      // Update the react-native and template packages with the react-native version
      // and nightly versions of monorepo deps
      setReactNativeVersion(version, monorepoNightlyVersions, buildType);
    } catch (e) {
      console.error(`Failed to set version number to ${version}`);
      console.error(e);
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

  const packagePath = path.join(__dirname, '..', 'packages', 'react-native');
  const result = publishPackage(packagePath, {
    tag,
    otp: process.env.NPM_CONFIG_OTP,
  });

  if (result.code) {
    echo('Failed to publish package to npm');
    return exit(1);
  } else {
    echo(`Published to npm ${version}`);
    return exit(0);
  }
}

module.exports = publishNpm;
