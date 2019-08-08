/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const RNCodegen = require('../src/generators/RNCodegen.js');
const fs = require('fs');
const mkdirp = require('mkdirp');

const args = process.argv.slice(2);
if (args.length !== 4) {
  throw new Error(
    `Expected to receive path to schema, library name, output directory and module spec name. Received ${args.join(
      ', ',
    )}`,
  );
}

const schemaPath = args[0];
const libraryName = args[1];
const outputDirectory = args[2];
const moduleSpecName = args[3];

const schemaText = fs.readFileSync(schemaPath, 'utf-8');

if (schemaText == null) {
  throw new Error(`Can't find schema at ${schemaPath}`);
}

mkdirp.sync(outputDirectory);

let schema;
try {
  schema = JSON.parse(schemaText);
} catch (err) {
  throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
}

RNCodegen.generate(
  {libraryName, schema, outputDirectory, moduleSpecName},
  {
    generators: [
      'descriptors',
      'events',
      'props',
      'tests',
      'shadow-nodes',
      'modules',
    ],
  },
);
