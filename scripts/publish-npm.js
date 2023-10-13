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
const {getNpmInfo} = require('./npm-utils'); // [macOS] Remove publishPackage as we don't use it for React Native macOS
const getAndUpdateNightlies = require('./monorepo/get-and-update-nightlies');
const setReactNativeVersion = require('./set-rn-version');
/* [macOS We do not generate Android artifacts for React Native macOS
const {
  generateAndroidArtifacts,
  publishAndroidArtifactsToMaven,
} = require('./release-utils');
macOS] */
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

/**
 * This script prepares a release version of react-native and may publish to NPM.
 * It is supposed to run in CI environment, not on a developer's machine.
 *
 * [macOS] For React Native macOS, we have modified this script to not create Android Artifacts.
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
    .option('t', {
      alias: 'builtType',
      describe: 'The type of build you want to perform.',
      choices: ['dry-run', 'nightly', 'release', 'prealpha'],
      default: 'dry-run',
    })
    .strict().argv;

  const buildType = argv.builtType;

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

  // [macOS] Do not generate Android artifacts for React Native macOS
  // generateAndroidArtifacts(version);

  if (buildType === 'dry-run') {
    echo('Skipping `npm publish` because --dry-run is set.');
    return exit(0);
  }

  // We first publish on Maven Central all the necessary artifacts.
  // NPM publishing is done just after.
  /* [macOS] Skip the Android Artifact and NPM Publish here as we do that in our Azure Pipeline
  // publishAndroidArtifactsToMaven(version, buildType === 'nightly');

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
  macOS] */
}

module.exports = publishNpm;
