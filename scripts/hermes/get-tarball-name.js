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
 * This script returns the filename that would be used for a
 * Hermes tarball for the given build type and release version.
 */
const yargs = require('yargs');
const {getHermesPrebuiltArtifactsTarballName} = require('./hermes-utils');

let argv = yargs
  .option('b', {
    alias: 'buildType',
    type: 'string',
    describe: 'Specifies whether Hermes was built for Debug or Release.',
    default: 'Debug',
  })
  .option('v', {
    alias: 'releaseVersion',
    type: 'string',
    describe: 'The version of React Native that will use this tarball.',
    default: '1000.0.0',
  }).argv;

async function main() {
  const tarballName = getHermesPrebuiltArtifactsTarballName(
    argv.buildType,
    argv.releaseVersion,
  );
  console.log(tarballName);
  return tarballName;
}

main().then(() => {
  process.exit(0);
});
