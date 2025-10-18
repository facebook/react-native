/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {
  updateHermesCompilerVersionInDependencies,
  updateHermesRuntimeDependenciesVersions,
  updateHermesVersionsToNightly,
} = require('./utils/hermes-utils');
const {parseArgs} = require('util');

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
    nightly: {
      type: 'boolean',
      short: 'n',
    },
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {
      help,
      'hermes-version': hermesVersion,
      'hermes-v1-version': hermesV1Version,
      nightly,
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
    --nightly          Update to the latest nightly versions of Hermes.
    --hermes-version       The new Hermes version string.
    --hermes-v1-version    The new Hermes v1 version string.
    `);
    return;
  }

  if (nightly) {
    await updateHermesVersionsToNightly();
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
  await updateHermesCompilerVersionInDependencies(hermesVersion);
  await updateHermesRuntimeDependenciesVersions(hermesVersion, hermesV1Version);
}

module.exports = {
  setHermesVersions,
};

if (require.main === module) {
  void main();
}
