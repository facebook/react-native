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

const GENERATORS = {
  android: ['componentsAndroid', 'modulesAndroid'],
  ios: ['componentsIOS', 'modulesIOS'],
};

function generateSpec(
  platform,
  schemaPath,
  outputDirectory,
  libraryName,
  packageName,
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

  RNCodegen.generate(
    {
      libraryName,
      schema,
      outputDirectory,
      packageName,
    },
    {
      generators: GENERATORS[platform],
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

  if (platform === 'ios') {
    const files = fs.readdirSync(outputDirectory);
    const componentsOutputDirectory = `${outputDirectory}/react/renderer/components/${libraryName}`;
    mkdirp.sync(componentsOutputDirectory);
    files
      .filter(
        f =>
          (f.endsWith('.h') && !f.startsWith(libraryName)) ||
          f.endsWith('.cpp'),
      )
      .forEach(f => {
        fs.renameSync(
          `${outputDirectory}/${f}`,
          `${componentsOutputDirectory}/${f}`,
        );
      });
  }
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
