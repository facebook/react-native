/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script returns the filename that would be used for a Hermes tarball
 * for the given tarball type, build type and release version.
 */
const yargs = require('yargs');
const {
  getHermesDebugSymbolsTarballName,
  getHermesPrebuiltArtifactsTarballName,
} = require('./hermes-utils');

let argv = yargs
  .option('b', {
    alias: 'buildType',
    type: 'string',
    choices: ['Debug', 'Release'],
    describe:
      'Specifies which Hermes build type to use when generating the name for the tarball.',
    default: 'Debug',
  })
  .version(false) // Disables --version as an alias for -v
  .option('v', {
    alias: 'releaseVersion',
    type: 'string',
    describe: 'The version string to use in the name for this tarball.',
    default: '1000.0.0',
  })
  .option('t', {
    alias: 'tarballType',
    type: 'string',
    choices: ['prebuilts', 'dsyms'],
    describe: 'Which Hermes tarball is this name for?',
    default: 'prebuilts',
    defaultDescription: 'Prebuilt Artifacts',
  }).argv;

async function main() {
  if (argv.tarballType === 'prebuilts') {
    const tarballName = getHermesPrebuiltArtifactsTarballName(
      argv.buildType,
      argv.releaseVersion,
    );
    console.log(tarballName);
    return tarballName;
  } else if (argv.tarballType === 'dsyms') {
    const tarballName = getHermesDebugSymbolsTarballName(
      argv.buildType,
      argv.releaseVersion,
    );
    console.log(tarballName);
    return tarballName;
  }
}

main().then(() => {
  process.exit(0);
});
