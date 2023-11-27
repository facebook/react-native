/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const executor = require('./codegen/generate-artifacts-executor.js');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'path',
    description: 'Path to the React Native project root.',
  })
  .option('o', {
    alias: 'outputPath',
    description: 'Path where generated artifacts will be output to.',
  })
  .usage('Usage: $0 -p [path to app]')
  .demandOption(['p']).argv;

executor.execute(argv.path, argv.outputPath);
