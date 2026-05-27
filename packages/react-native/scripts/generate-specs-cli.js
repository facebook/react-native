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

const executor = require('./codegen/generate-specs-cli-executor');
const yargs = require('yargs');

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
      'Path to the root directory where native code source files should be saved.',
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
  .usage('Usage: $0 <args>')
  .demandOption(
    ['platform', 'schemaPath', 'outputDir'],
    'Please provide platform, schema path, and output directory.',
  ).argv;

function main() {
  executor.execute(
    // $FlowFixMe[prop-missing]
    argv.platform,
    // $FlowFixMe[prop-missing]
    argv.schemaPath,
    // $FlowFixMe[prop-missing]
    argv.outputDir,
    // $FlowFixMe[prop-missing]
    argv.libraryName,
    // $FlowFixMe[prop-missing]
    argv.javaPackageName,
    // $FlowFixMe[prop-missing]
    argv.libraryType,
  );
}

main();
