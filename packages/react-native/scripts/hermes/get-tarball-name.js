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

const {getHermesPrebuiltArtifactsTarballName} = require('./hermes-utils');
/**
 * This script returns the filename that would be used for a
 * Hermes tarball for the given build type and release version.
 */
const yargs = require('yargs');

let argv = yargs.option('b', {
  alias: 'buildType',
  type: 'string',
  describe: 'Specifies whether Hermes was built for Debug or Release.',
  default: 'Debug',
}).argv;

async function main() {
  // $FlowFixMe[prop-missing]
  const tarballName = getHermesPrebuiltArtifactsTarballName(argv.buildType);
  console.log(tarballName);
  return tarballName;
}

void main().then(() => {
  process.exit(0);
});
