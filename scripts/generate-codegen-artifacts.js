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
  .option('f', {
    alias: 'configFilename',
    default: 'package.json',
    description: 'The file that contains the codegen configuration.',
  })
  .option('k', {
    alias: 'configKey',
    default: 'codegenConfig',
    description:
      'The key that contains the codegen configuration in the config file.',
  })
  .option('e', {
    alias: 'fabricEnabled',
    default: true,
    description: 'A flag to control whether to generate fabric components.',
    boolean: 'e',
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

const CODEGEN_CONFIG_FILENAME = argv.f;
const CODEGEN_CONFIG_FILE_DIR = argv.c;
const CODEGEN_CONFIG_KEY = argv.k;
const CODEGEN_FABRIC_ENABLED = argv.e;
const NODE = argv.n;

const appRoot = argv.path;
const outputPath = argv.outputPath;

executor.execute(
  appRoot,
  outputPath,
  NODE,
  CODEGEN_CONFIG_FILENAME,
  CODEGEN_CONFIG_KEY,
  CODEGEN_CONFIG_FILE_DIR,
  CODEGEN_FABRIC_ENABLED,
);
