/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const RNCodegen = require('../packages/react-native-codegen/lib/generators/RNCodegen.js');
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

function generateSpec(
  platform,
  schemaPath,
  outputDirectory,
  libraryName,
  javaPackageName,
) {
  const moduleSpecName = libraryName;
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');

  if (schemaText == null) {
    throw new Error(`Can't find schema at ${schemaPath}`);
  }

  const tempOutputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'react-native-codegen-'),
  );

  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
  }

  RNCodegen.generate(
    {libraryName, schema, outputDirectory: tempOutputDirectory, moduleSpecName},
    {
      generators: platform === 'android' ? ['modulesAndroid'] : ['modules'],
    },
  );

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

  if (platform === 'ios') {
    const fileNames = [`${moduleSpecName}.h`, `${moduleSpecName}-generated.mm`];
    fileNames.forEach(fileName => {
      const newOutput = `${tempOutputDirectory}/${fileName}`;
      const prevOutput = `${outputDirectory}/${fileName}`;
      fs.copyFileSync(newOutput, prevOutput);
    });
  } else if (platform === 'android') {
    // Copy all .java files for now.
    // TODO: Build sufficient support for producing Java package directories based
    // on preferred package name.
    const files = fs.readdirSync(tempOutputDirectory);
    const javaOutputDirectory = `${outputDirectory}/java/${javaPackageName.replace(
      /\./g,
      '/',
    )}`;
    mkdirp.sync(javaOutputDirectory);
    files
      .filter(f => f.endsWith('.java'))
      .forEach(f => {
        fs.copyFileSync(
          `${tempOutputDirectory}/${f}`,
          `${javaOutputDirectory}/${f}`,
        );
      });

    // And all C++ files for JNI.
    const jniOutputDirectory = `${outputDirectory}/jni`;
    mkdirp.sync(jniOutputDirectory);
    files
      .filter(
        f =>
          f.startsWith(moduleSpecName) &&
          (f.endsWith('.h') || f.endsWith('.cpp')),
      )
      .forEach(f => {
        fs.copyFileSync(
          `${tempOutputDirectory}/${f}`,
          `${jniOutputDirectory}/${f}`,
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
