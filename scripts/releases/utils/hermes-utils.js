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
  compilerV1Version: string,
  runtimeVersion: string,
  runtimeV1Version: string,
}> */ {
  // fetch the latest commitly version of hermes v0
  const compilerVersion = await getPackageVersionStrByTag(
    'hermes-compiler',
    'nightly',
  );
  // fetch the latest version of hermes v1
  const compilerV1Version = await getPackageVersionStrByTag(
    'hermes-compiler',
    'latest-v1',
  );

  return {
    compilerVersion,
    compilerV1Version,
    // runtime version should match the compiler version
    runtimeVersion: compilerVersion,
    runtimeV1Version: compilerV1Version,
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
    hermesVersions.compilerV1Version,
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
