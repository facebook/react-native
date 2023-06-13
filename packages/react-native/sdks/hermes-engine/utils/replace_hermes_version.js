/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const LAST_BUILD_FILENAME = '.last_build_configuration';

function validateBuildConfiguration(configuration) {
  if (!['Debug', 'Release'].includes(configuration)) {
    throw new Error(`Invalid configuration ${configuration}`);
  }
}

function validateVersion(version) {
  if (version == null || version === '') {
    throw new Error('Version cannot be empty');
  }
}

function shouldReplaceHermesConfiguration(configuration) {
  const fileExists = fs.existsSync(LAST_BUILD_FILENAME);

  if (fileExists) {
    console.log(`Found ${LAST_BUILD_FILENAME} file`);
    const oldConfiguration = fs.readFileSync(LAST_BUILD_FILENAME);
    if (oldConfiguration === configuration) {
      console.log('No need to download a new build of Hermes!');
      return false;
    }
  }

  // Assumption: if there is no stored last build, we assume that it was build for debug.
  if (!fs.existsSync && configuration === 'Debug') {
    console.log(
      'File does not exists, but Debug configuration. No need to download a new build of Hermes!',
    );
    return false;
  }

  return true;
}

function replaceHermesConfiguration(configuration, version, reactNativePath) {
  const tarballURLPath = `${reactNativePath}/sdks/downloads/hermes-ios-${version}-${configuration}.tar.gz`;

  const finalLocation = 'Pods/hermes-engine';
  console.log('Preparing the final location');
  fs.rmSync(finalLocation, {force: true, recursive: true});
  fs.mkdirSync(finalLocation, {recursive: true});

  console.log('Extracting the tarball');
  execSync(`tar -xf ${tarballURLPath} -C ${finalLocation}`);
}

function updateLastBuildConfiguration(configuration) {
  fs.writeFileSync(LAST_BUILD_FILENAME, configuration);
}

function main(configuration, version, reactNativePath) {
  validateBuildConfiguration(configuration);
  validateVersion(version);

  if (!shouldReplaceHermesConfiguration(configuration)) {
    return;
  }

  replaceHermesConfiguration(configuration, version, reactNativePath);
  updateLastBuildConfiguration(configuration);
}

// This script is executed in the Pods folder, which is usually not synched to Github, so it should be ok
const argv = yargs
  .option('c', {
    alias: 'configuration',
    description:
      'Configuration to use to download the right Hermes version. Allowed values are "Debug" and "Release".',
  })
  .option('r', {
    alias: 'reactNativeVersion',
    description:
      'The Version of React Native associated with the Hermes tarball.',
  })
  .option('p', {
    alias: 'reactNativePath',
    description: 'The path to the React Native root folder',
  })
  .usage('Usage: $0 -c Debug -r <version> -p <path/to/react-native>').argv;

const configuration = argv.configuration;
const version = argv.reactNativeVersion;
const reactNativePath = argv.reactNativePath;

throw new Error(`React native path is: ${reactNativePath}`);
main(configuration, version, reactNativePath);
