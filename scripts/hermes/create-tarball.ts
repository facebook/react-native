/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * This script creates a Hermes prebuilt artifacts tarball.
 * Must be invoked after Hermes has been built.
 */
import yargs from 'yargs';
import {createHermesPrebuiltArtifactsTarball} from './hermes-utils';

const argv = yargs
  .option('inputDir', {
    alias: 'i',
    type: 'string',
    describe: 'Path to directory where Hermes build artifacts were generated.',
  })
  .option('buildType', {
    alias: 'b',
    type: 'string',
    describe: 'Specifies whether Hermes was built for Debug or Release.',
    default: 'Debug',
  })
  .option('outputDir', {
    alias: 'o',
    type: 'string',
    describe: 'Location where the tarball will be saved to.',
  })
  .option('excludeDebugSymbols', {
    alias: 'exclude-debug-symbols',
    describe: 'Whether dSYMs should be excluded from the tarball.',
    type: 'boolean',
    default: true,
  })
  .parseSync();

function main() {
  const {inputDir: hermesDir, buildType, excludeDebugSymbols} = argv;

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

  if (!hermesDir) {
    throw new Error('hermesDir is not specified');
  }

  const tarballOutputPath = createHermesPrebuiltArtifactsTarball(
    hermesDir,
    buildType,
    tarballOutputDir!,
    excludeDebugSymbols,
  );
  console.log(tarballOutputPath);

  return tarballOutputPath;
}

main();
