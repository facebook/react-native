/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

let RNCodegen;
try {
  RNCodegen = require('../packages/react-native-codegen/lib/generators/RNCodegen.js');
} catch (e) {
  RNCodegen = require('@react-native/codegen/lib/generators/RNCodegen.js');
  if (!RNCodegen) {
    throw 'RNCodegen not found.';
  }
}

const fs = require('fs');
const mkdirp = require('mkdirp');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'platform',
    describe: 'Platform to generate native code artifacts for.',
  })
  .option('s', {
    alias: 'schemaListPath',
    describe: 'The path to the schema list file.',
  })
  .option('o', {
    alias: 'outputDir',
    describe:
      'Path to directory where native code source files should be saved.',
  })
  .usage('Usage: $0 <args>')
  .demandOption(
    ['platform', 'schemaListPath', 'outputDir'],
    'Please provide platform, schema path, and output directory.',
  ).argv;

const GENERATORS = {
  android: [],
  ios: ['providerIOS'],
};

function generateProvider(platform, schemaListPath, outputDirectory) {
  const schemaListText = fs.readFileSync(schemaListPath, 'utf-8');

  if (schemaListText == null) {
    throw new Error(`Can't find schema list file at ${schemaListPath}`);
  }

  if (!outputDirectory) {
    throw new Error('outputDir is required');
  }
  mkdirp.sync(outputDirectory);

  let schemaPaths;
  try {
    schemaPaths = JSON.parse(schemaListText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaListPath}`);
  }

  const schemas = {};
  try {
    for (const libraryName of Object.keys(schemaPaths)) {
      const tmpSchemaText = fs.readFileSync(schemaPaths[libraryName], 'utf-8');
      schemas[libraryName] = JSON.parse(tmpSchemaText);
    }
  } catch (err) {
    throw new Error(`Failed to read schema file. ${err.message}`);
  }

  if (GENERATORS[platform] == null) {
    throw new Error(`Invalid platform type. ${platform}`);
  }

  RNCodegen.generateFromSchemas(
    {
      schemas,
      outputDirectory,
    },
    {
      generators: GENERATORS[platform],
    },
  );
}

function main() {
  generateProvider(argv.platform, argv.schemaListPath, argv.outputDir);
}

main();
