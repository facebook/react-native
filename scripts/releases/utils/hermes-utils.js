/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {REACT_NATIVE_PACKAGE_DIR} = require('../../shared/consts');
const {
  getPackages,
  getWorkspaceRoot,
  updatePackageJson,
} = require('../../shared/monorepoUtils');
const {getLatestMavenSnapshotVersion} = require('./maven-utils');
const {getPackageVersionStrByTag} = require('./npm-utils');
const {promises: fs} = require('fs');
const path = require('path');

const MAVEN_VERSIONS_FILE_PATH = path.join(
  REACT_NATIVE_PACKAGE_DIR,
  'sdks',
  'hermes-engine',
  'version.properties',
);

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

async function updateHermesCompilerVersionInDependencies(
  hermesVersion /*: string */,
) /*: Promise<void> */ {
  const packages = await getPackages({
    includePrivate: true,
    includeReactNative: true,
  });

  const packagesToUpdate = [
    await getWorkspaceRoot(),
    ...Object.values(packages),
  ];

  // Update generated files in packages/react-native/
  await Promise.all(
    packagesToUpdate.map(pkg =>
      updatePackageJson(pkg, {'hermes-compiler': hermesVersion}),
    ),
  );
}

async function updateHermesRuntimeDependenciesVersions(
  hermesVersion /*: string */,
  hermesV1Version /*: string */,
) /*: Promise<void> */ {
  const newVersionsFile =
    `HERMES_VERSION_NAME=${hermesVersion}\n` +
    `HERMES_V1_VERSION_NAME=${hermesV1Version}`;

  await fs.writeFile(MAVEN_VERSIONS_FILE_PATH, newVersionsFile.trim() + '\n');
}

async function updateHermesVersionsToNightly() {
  const hermesVersions = await getLatestHermesNightlyVersion();
  await updateHermesCompilerVersionInDependencies(
    hermesVersions.compilerVersion,
  );
  await updateHermesRuntimeDependenciesVersions(
    hermesVersions.runtimeVersion,
    hermesVersions.runtimeV1Version,
  );
}

module.exports = {
  updateHermesVersionsToNightly,
  updateHermesCompilerVersionInDependencies,
  updateHermesRuntimeDependenciesVersions,
};
