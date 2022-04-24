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
  RNCodegen = require('react-native-codegen/lib/generators/RNCodegen.js');
  if (!RNCodegen) {
    throw 'RNCodegen not found.';
  }
}

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
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
      'Path to directory where native code source files should be saved.',
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

const GENERATORS = {
  all: {
    android: ['componentsAndroid', 'modulesAndroid'],
    ios: ['componentsIOS', 'modulesIOS'],
  },
  components: {
    android: ['componentsAndroid'],
    ios: ['componentsIOS'],
  },
  modules: {
    android: ['modulesAndroid'],
    ios: ['modulesIOS'],
  },
};

function generateSpec(
  platform,
  schemaPath,
  outputDirectory,
  libraryName,
  packageName,
  libraryType,
) {
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');

  if (schemaText == null) {
    throw new Error(`Can't find schema at ${schemaPath}`);
  }

  if (!outputDirectory) {
    outputDirectory = path.resolve(__dirname, '..', 'Libraries', libraryName);
  }
  mkdirp.sync(outputDirectory);

  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
  }

  if (GENERATORS[libraryType] == null) {
    throw new Error(`Invalid library type. ${libraryType}`);
  }

  RNCodegen.generate(
    {
      libraryName,
      schema,
      outputDirectory,
      packageName,
    },
    {
      generators: GENERATORS[libraryType][platform],
    },
  );

  if (platform === 'android') {
    // Move all components C++ files to a structured jni folder for now.
    // Note: this should've been done by RNCodegen's generators, but:
    // * the generators don't support platform option yet
    // * this subdir structure is Android-only, not applicable to iOS
    const files = fs.readdirSync(outputDirectory);
    const jniOutputDirectory = `${outputDirectory}/jni/react/renderer/components/${libraryName}`;
    mkdirp.sync(jniOutputDirectory);
    files
      .filter(f => f.endsWith('.h') || f.endsWith('.cpp'))
      .forEach(f => {
        fs.renameSync(`${outputDirectory}/${f}`, `${jniOutputDirectory}/${f}`);
      });
  }
}

function main() {
  generateSpec(
    argv.platform,
    argv.schemaPath,
    argv.outputDir,
    argv.libraryName,
    argv.javaPackageName,
    argv.libraryType,
  );
}

main();
