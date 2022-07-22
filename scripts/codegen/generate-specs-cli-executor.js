/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const utils = require('./codegen-utils');
const RNCodegen = utils.getCodegen();

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

function createOutputDirectoryIfNeeded(outputDirectory, libraryName) {
  if (!outputDirectory) {
    outputDirectory = path.resolve(__dirname, '..', 'Libraries', libraryName);
  }
  mkdirp.sync(outputDirectory);
}

function createFolderIfDefined(folder) {
  if (folder) {
    mkdirp.sync(folder);
  }
}

/**
 * This function read a JSON schema from a path and parses it.
 * It throws if the schema don't exists or it can't be parsed.
 *
 * @parameter schemaPath: the path to the schema
 * @return a valid schema
 * @throw an Error if the schema doesn't exists in a given path or if it can't be parsed.
 */
function readAndParseSchema(schemaPath) {
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');

  if (schemaText == null) {
    throw new Error(`Can't find schema at ${schemaPath}`);
  }

  try {
    return JSON.parse(schemaText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
  }
}

function validateLibraryType(libraryType) {
  if (GENERATORS[libraryType] == null) {
    throw new Error(`Invalid library type. ${libraryType}`);
  }
}

function generateSpec(
  platform,
  schemaPath,
  outputDirectory,
  libraryName,
  packageName,
  libraryType,
) {
  validateLibraryType(libraryType);

  let schema = readAndParseSchema(schemaPath);

  createOutputDirectoryIfNeeded(outputDirectory, libraryName);
  function composePath(intermediate) {
    return path.join(outputDirectory, intermediate, libraryName);
  }

  // These are hardcoded and should not be changed.
  // The codegen creates some C++ code with #include directive
  // which uses these paths. Those directive are not customizable yet.
  createFolderIfDefined(composePath('react/renderer/components/'));
  createFolderIfDefined(composePath('./'));

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

module.exports = {
  execute: generateSpec,
};
