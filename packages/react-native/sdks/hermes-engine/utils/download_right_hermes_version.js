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

function shouldDownloadRightHermesVersion(configuration) {
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

function downloadRightHermesVersion(configuration, version) {
  const tarballURL = `https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${version}/react-native-artifacts-${version}-hermes-ios-${configuration.toLowerCase()}.tar.gz`;
  const destinationFolder = 'Pods/hermes-engine_tmp';
  const fileName = 'tmp_hermes_ios.tar.gz';
  const filePath = path.join(destinationFolder, fileName);

  console.log('Creating the destination folder');
  fs.mkdirSync(destinationFolder, {recursive: true});

  console.log(`Downloading the tarball ${tarballURL} into ${filePath}`);
  const command = `curl ${tarballURL} -Lo ${filePath}`;
  execSync(command);

  const finalLocation = 'Pods/hermes-engine';
  console.log('Preparing the final location');
  fs.rmSync(finalLocation, {force: true, recursive: true});
  fs.mkdirSync(finalLocation, {recursive: true});

  console.log('Extracting the tarball');
  execSync(`tar -xf ${filePath} -C ${finalLocation}`);

  fs.rmSync(destinationFolder, {force: true, recursive: true});
}

function updateLastBuildConfiguration(configuration) {
  fs.writeFileSync(LAST_BUILD_FILENAME, configuration);
}

function main(configuration, version) {
  validateBuildConfiguration(configuration);
  validateVersion(version);

  if (!shouldDownloadRightHermesVersion(configuration)) {
    return;
  }

  downloadRightHermesVersion(configuration, version);
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
  .usage('Usage: $0 -c Debug -r <version>').argv;

const configuration = argv.configuration;
const version = argv.reactNativeVersion;

main(configuration, version);
