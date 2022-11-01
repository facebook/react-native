/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * This script creates a Hermes prebuilt artifacts tarball.
 * Must be invoked after Hermes has been built.
 */
const yargs = require('yargs');
const {createHermesPrebuiltArtifactsTarball} = require('./hermes-utils');

let argv = yargs
  .option('i', {
    alias: 'inputDir',
    describe: 'Path to directory where Hermes build artifacts were generated.',
  })
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
  })
  .option('o', {
    alias: 'outputDir',
    describe: 'Location where the tarball will be saved to.',
  }).argv;

async function main() {
  const hermesDir = argv.inputDir;
  const buildType = argv.buildType;
  const releaseVersion = argv.releaseVersion;
  let tarballOutputDir = argv.outputDir;

  if (!tarballOutputDir) {
    try {
      tarballOutputDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'hermes-engine-tarball-'),
      );
    } catch (error) {
      throw new Error(
        `[Hermes] Failed to create temporary output directory: ${error}`,
      );
    }
  }

  const tarballOutputPath = createHermesPrebuiltArtifactsTarball(
    hermesDir,
    buildType,
    releaseVersion,
    tarballOutputDir,
  );
  console.log(tarballOutputPath);
  return tarballOutputPath;
}

main().then(() => {
  process.exit(0);
});
