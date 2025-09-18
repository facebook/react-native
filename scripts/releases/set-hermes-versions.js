/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {REACT_NATIVE_PACKAGE_DIR} = require('../shared/consts');
const {
  getPackages,
  getWorkspaceRoot,
  updatePackageJson,
} = require('../shared/monorepoUtils');
const {promises: fs} = require('fs');
const path = require('path');
const {parseArgs} = require('util');

const MAVEN_VERSIONS_FILE_PATH = path.join(
  REACT_NATIVE_PACKAGE_DIR,
  'sdks',
  'hermes-engine',
  'version.properties',
);

const config = {
  options: {
    'hermes-version': {
      type: 'string',
      short: 'h',
    },
    'hermes-v1-version': {
      type: 'string',
      short: 's',
    },
    help: {type: 'boolean'},
  },
};

/**
 * @deprecated This script entry point is deprecated. Please use `set-version`
 * instead.
 */
async function main() {
  const {
    values: {
      help,
      'hermes-version': hermesVersion,
      'hermes-v1-version': hermesV1Version,
    },
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/set-hermes-versions.js [OPTIONS]

  Updates relevant files, including package.json, in the react-native
  package to change the Hermes versions.

  Options:
    --hermes-version       The new Hermes version string.
    --hermes-v1-version    The new Hermes v1 version string.
    `);
    return;
  }

  if (!hermesVersion) {
    throw new Error('Missing --hermes-version argument');
  }

  if (!hermesV1Version) {
    throw new Error('Missing --hermes-v1-version argument');
  }

  await setHermesVersions(hermesVersion, hermesV1Version);
}

async function setHermesVersions(
  hermesVersion /*: string */,
  hermesV1Version /*: string */,
) /*: Promise<void> */ {
  await updateHermesCompilerVersion(hermesVersion);
  await updateHermesRuntimeDependenciesVersions(hermesVersion, hermesV1Version);
}

async function updateHermesCompilerVersion(
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

module.exports = {
  updateHermesCompilerVersion,
  updateHermesRuntimeDependenciesVersions,
  setHermesVersions,
};

if (require.main === module) {
  void main();
}
