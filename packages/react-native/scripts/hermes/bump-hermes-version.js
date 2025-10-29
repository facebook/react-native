#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  updateHermesCompilerVersionInDependencies,
  updateHermesRuntimeDependenciesVersions,
} = require('../../../../scripts/releases/utils/hermes-utils');
const {
  getPackageVersionStrByTag,
} = require('../../../../scripts/releases/utils/npm-utils');
const {setHermesTag} = require('./hermes-utils');
// $FlowFixMe[untyped-import]
const inquirer = require('inquirer');
/**
 * This script walks a releaser through bumping the Hermes version for a release.
 * It needs be executed on a release branch.
 */
const {exit} = require('shelljs');
const yargs = require('yargs');

let argv = yargs
  .option('t', {
    alias: 'tag',
    describe:
      'Hermes release tag to use for this React Native release, ex. hermes-2022-02-21-RNv0.68.0. This tag will be used when building Hermes from source.',
    required: true,
  })
  .option('s', {
    alias: 'v1-tag',
    describe:
      'Hermes V1 release tag to use for this React Native release, ex. 250829098.0.0. This tag will be used when building Hermes V1 from source.',
    required: true,
  })
  .option('h', {
    alias: 'hermes-version',
    describe:
      'Hermes version to use for this React Native release, ex. 250829098.0.0. This version will be used when consuming Hermes from a prebuilt package.',
    required: false,
  })
  .option('v', {
    alias: 'hermes-v1-version',
    describe:
      'Hermes V1 version to use for this React Native release, ex. 250829098.0.0. This version will be used when consuming Hermes V1 from a prebuilt package.',
    required: false,
  }).argv;

async function main() {
  // $FlowFixMe[prop-missing]
  const hermesTag = argv.tag;
  // $FlowFixMe[prop-missing]
  const hermesV1Tag = argv['v1-tag'];
  // $FlowFixMe[prop-missing]
  let hermesVersion = argv['hermes-version'];
  // $FlowFixMe[prop-missing]
  let hermesV1Version = argv['hermes-v1-version'];

  if (!hermesVersion) {
    console.log(
      'No Hermes version provided. Fetching the latest version from NPM...',
    );
    hermesVersion = await getPackageVersionStrByTag(
      'hermes-compiler',
      'latest-v0',
    );
  }

  if (!hermesV1Version) {
    console.log(
      'No Hermes V1 version provided. Fetching the latest version from NPM...',
    );
    hermesV1Version = await getPackageVersionStrByTag(
      'hermes-compiler',
      'latest-v1',
    );
  }

  const {confirmHermesVersions} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmHermesVersions',
    message: `Do you want to use the Hermes version "${hermesVersion}" and Hermes V1 version "${hermesV1Version}" (for prebuilt)?`,
  });

  if (!confirmHermesVersions) {
    console.log('Aborting.');
    return;
  }

  const {confirmHermesTags} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmHermesTags',
    message: `Do you want to use the Hermes release tagged "${hermesTag}" and Hermes V1 release tagged "${hermesV1Tag}" (for building from source)?`,
  });

  if (!confirmHermesTags) {
    console.log('Aborting.');
    return;
  }

  await setHermesTag(hermesTag, hermesV1Tag);

  await updateHermesCompilerVersionInDependencies(hermesVersion);
  await updateHermesRuntimeDependenciesVersions(hermesVersion, hermesV1Version);
}

void main().then(() => {
  exit(0);
});
