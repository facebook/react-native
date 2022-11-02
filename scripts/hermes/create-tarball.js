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
 * Use this script to create a tarball of Hermes build artifacts.
 * The Hermes build artifacts must exist before invoking this script.
 *
 * Supported Hermes tarball types:
 *
 *  - Prebuilt Artifacts: A tarball containing the Hermes build artifacts.
 *    Can be used with HERMES_ENGINE_TARBALL_PATH to use the prebuilts in
 *    `hermes-engine.podspec` and avoid building Hermes from source.
 *
 *  - Debug Symbols: A tarball containing just the debug symbols for the
 *    Hermes build artifacts.
 */
const yargs = require('yargs');
const {
  createHermesDebugSymbolsTarball,
  createHermesPrebuiltArtifactsTarball,
} = require('./hermes-utils');

let argv = yargs
  .option('i', {
    alias: 'inputDir',
    describe: 'Path to directory where Hermes build artifacts were generated.',
  })
  .option('o', {
    alias: 'outputDir',
    describe: 'Location where the tarball will be saved to.',
  })
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
    describe: 'Specifies which Hermes tarball to create.',
    default: 'prebuilts',
    defaultDescription: 'Prebuilt Artifacts',
  })
  .option('exclude-debug-symbols', {
    describe: 'Whether dSYMs should be excluded from the prebuilts tarball.',
    type: 'boolean',
    default: true,
  })
  .demandOption(
    ['inputDir', 'outputDir'],
    'Please provide both inputDir and outputDir arguments.',
  ).argv;

async function main() {
  const hermesDir = argv.inputDir;
  const buildType = argv.buildType;
  const releaseVersion = argv.releaseVersion;
  let tarballOutputDir = argv.outputDir;

  if (!tarballOutputDir) {
    try {
      tarballOutputDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'hermes-tarball-'),
      );
    } catch (error) {
      throw new Error(
        `[Hermes] Failed to create temporary output directory: ${error}`,
      );
    }
  }

  if (argv.tarballType === 'prebuilts') {
    const excludeDebugSymbols = argv.excludeDebugSymbols;
    const tarballOutputPath = createHermesPrebuiltArtifactsTarball(
      hermesDir,
      buildType,
      releaseVersion,
      tarballOutputDir,
      excludeDebugSymbols,
    );
    console.log(tarballOutputPath);
    return tarballOutputPath;
  } else if (argv.tarballType === 'dsyms') {
    const tarballOutputPath = createHermesDebugSymbolsTarball(
      hermesDir,
      buildType,
      releaseVersion,
      tarballOutputDir,
    );
    console.log(tarballOutputPath);
    return tarballOutputPath;
  }
}

main().then(() => {
  process.exit(0);
});
