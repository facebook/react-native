/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

let RNCodegen;
try {
  RNCodegen = require('react-native-codegen/lib/generators/RNCodegen.js');
} catch (e) {
  RNCodegen = require('../packages/react-native-codegen/lib/generators/RNCodegen.js');
  if (!RNCodegen) {
    throw 'RNCodegen not found.';
  }
}

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const GENERATORS = {
  android: ['modulesAndroid'],
  ios: ['modulesIOS'],
};

function generateSpec(
  platform,
  schemaPath,
  outputDirectory,
  libraryName,
  packageName,
) {
  const moduleSpecName = libraryName;
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');

  if (schemaText == null) {
    throw new Error(`Can't find schema at ${schemaPath}`);
  }

  if (!outputDirectory) {
    outputDirectory = path.resolve(
      __dirname,
      '..',
      'Libraries',
      libraryName,
      moduleSpecName,
    );
  }
  mkdirp.sync(outputDirectory);

  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
  }

  RNCodegen.generate(
    {
      libraryName,
      schema,
      outputDirectory,
      moduleSpecName,
      packageName,
    },
    {
      generators: GENERATORS[platform],
    },
  );
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0];
  const schemaPath = args[1];
  const outputDir = args[2];
  const libraryName = args[3] || 'FBReactNativeSpec';
  const javaPackageName = args[4] || 'com.facebook.fbreact.specs';
  generateSpec(platform, schemaPath, outputDir, libraryName, javaPackageName);
}

main();
