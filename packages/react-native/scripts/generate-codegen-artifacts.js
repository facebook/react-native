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
    description: 'Path to React Native application',
  })
  .option('o', {
    alias: 'outputPath',
    description: 'Path where generated artifacts will be output to',
  })
  .option('c', {
    alias: 'configFileDir',
    default: '',
    description:
      'Path where codegen config files are located (e.g. node_modules dir).',
  })
  .option('n', {
    alias: 'nodeBinary',
    default: 'node',
    description: 'Path to the node executable.',
  })
  .usage('Usage: $0 -p [path to app]')
  .demandOption(['p']).argv;

executor.execute(
  argv.path,
  argv.outputPath,
  argv.nodeBinary,
  argv.configFileDir,
);
