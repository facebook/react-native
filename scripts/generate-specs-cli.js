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
      'DEPRECATED - Path to directory where native code source files should be saved.',
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
  .option('c', {
    alias: 'componentsOutputDir',
    describe: 'Output directory for the codeGen for Fabric Components',
  })
  .option('m', {
    alias: 'modulesOutputDirs',
    describe: 'Output directory for the codeGen for TurboModules',
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

function deprecated_createOutputDirectoryIfNeeded(
  outputDirectory,
  libraryName,
) {
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
  componentsOutputDir,
  modulesOutputDirs,
) {
  validateLibraryType(libraryType);

  let schema = readAndParseSchema(schemaPath);

  createFolderIfDefined(componentsOutputDir);
  createFolderIfDefined(modulesOutputDirs);
  deprecated_createOutputDirectoryIfNeeded(outputDirectory, libraryName);

  RNCodegen.generate(
    {
      libraryName,
      schema,
      outputDirectory,
      packageName,
      componentsOutputDir,
      modulesOutputDirs,
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
    argv.componentsOutputDir,
    argv.modulesOutputDirs,
  );
}

main();
