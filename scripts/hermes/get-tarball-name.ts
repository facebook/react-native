/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This script returns the filename that would be used for a
 * Hermes tarball for the given build type and release version.
 */
import yargs from 'yargs';
import {getHermesPrebuiltArtifactsTarballName} from './hermes-utils';

const argv = yargs
  .option('buildType', {
    alias: 'b',
    type: 'string',
    describe: 'Specifies whether Hermes was built for Debug or Release.',
    default: 'Debug',
  })
  .parseSync();

function main() {
  const tarballName = getHermesPrebuiltArtifactsTarballName(argv.buildType);
  console.log(tarballName);

  return tarballName;
}

main();
