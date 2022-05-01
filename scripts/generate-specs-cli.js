/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const yargs = require('yargs');
const executor = require('./codegen/generate-specs-cli-executor');

const argv = yargs
  .option('p', {
    alias: 'platform',
    describe: 'Platform to generate native code artifacts for.',
  })
  .option('s', {
    alias: 'schemaPath',
    describe: 'The path to the schema file.',
  })
  .option('o', {
    alias: 'outputDir',
    describe:
      'DEPRECATED - Path to directory where native code source files should be saved.',
  })
  .option('n', {
    alias: 'libraryName',
    describe: 'Name of specs library.',
    default: 'FBReactNativeSpec',
  })
  .option('j', {
    alias: 'javaPackageName',
    describe: 'Name of Java package.',
    default: 'com.facebook.fbreact.specs',
  })
  .option('t', {
    alias: 'libraryType',
    describe: 'all, components, or modules.',
    default: 'all',
  })
  .option('c', {
    alias: 'componentsOutputDir',
    describe: 'Output directory for the codeGen for Fabric Components',
  })
  .option('m', {
    alias: 'modulesOutputDirs',
    describe: 'Output directory for the codeGen for TurboModules',
  })
  .usage('Usage: $0 <args>')
  .demandOption(
    ['platform', 'schemaPath', 'outputDir'],
    'Please provide platform, schema path, and output directory.',
  ).argv;

function main() {
  executor.execute(
    argv.platform,
    argv.schemaPath,
    argv.outputDir,
    argv.libraryName,
    argv.javaPackageName,
    argv.libraryType,
    argv.componentsOutputDir,
    argv.modulesOutputDirs,
  );
}

main();
