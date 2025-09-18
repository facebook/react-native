/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {getLatestMavenSnapshotVersion} = require('./maven-utils');
const {getPackageVersionStrByTag} = require('./npm-utils');

async function getLatestHermesNightlyVersion() /*: Promise<{
  compilerVersion: string,
  runtimeVersion: string,
  runtimeV1Version: string,
}> */ {
  const compilerVersion = await getPackageVersionStrByTag(
    'hermes-compiler',
    'nightly',
  );
  const runtimeVersion = await getLatestMavenSnapshotVersion(
    'com.facebook.hermes',
    'hermes-android',
  );

  // TODO: also fetch latest Hermes V1 runtime version

  return {
    compilerVersion,
    runtimeVersion,
    runtimeV1Version: '250829098.0.0',
  };
}

module.exports = {
  getLatestHermesNightlyVersion,
};
