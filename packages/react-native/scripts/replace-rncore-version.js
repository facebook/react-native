/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {spawnSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

const LAST_BUILD_FILENAME = 'React-Core-prebuilt/.last_build_configuration';

function validateBuildConfiguration(configuration /*: string */) {
  if (!['Debug', 'Release'].includes(configuration)) {
    throw new Error(`Invalid configuration ${configuration}`);
  }
}

function validateVersion(version /*: ?string */) {
  if (version == null || version === '') {
    throw new Error('Version cannot be empty');
  }
}

function shouldReplaceRnCoreConfiguration(configuration /*: string */) {
  const fileExists = fs.existsSync(LAST_BUILD_FILENAME);

  if (fileExists) {
    console.log(`Found ${LAST_BUILD_FILENAME} file`);
    const oldConfiguration = fs.readFileSync(LAST_BUILD_FILENAME).toString();
    if (oldConfiguration === configuration) {
      console.log(
        'Same config of the previous build. No need to replace React-Core-prebuilt',
      );
      return false;
    }
  }

  // Assumption: if there is no stored last build, we assume that it was build for debug.
  if (!fileExists && configuration === 'Debug') {
    console.log(
      'No previous build detected, but Debug Configuration. No need to replace React-Core-prebuilt',
    );
    return false;
  }

  return true;
}

function replaceRNCoreConfiguration(
  configuration /*: string */,
  version /*: string */,
  podsRoot /*: string */,
) {
  // Filename comes from rncore.rb
  const tarballURLPath = `${podsRoot}/ReactNativeCore-artifacts/reactnative-core-${version.toLowerCase()}-${configuration.toLowerCase()}.tar.gz`;

  const finalLocation = 'React-Core-prebuilt';

  // Extract to a temporary directory on a regular filesystem first, then move
  // into the final location. This avoids issues with partial tar extraction on
  // certain filesystems (e.g. EdenFS) where extracting directly can silently
  // produce incomplete results.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncore-'));
  const tmpExtractDir = path.join(tmpDir, 'React-Core-prebuilt');
  fs.mkdirSync(tmpExtractDir, {recursive: true});

  try {
    console.log('Extracting the tarball to temp dir', tarballURLPath);
    const result = spawnSync(
      'tar',
      ['-xf', tarballURLPath, '-C', tmpExtractDir],
      {
        stdio: 'inherit',
      },
    );

    if (result.status !== 0) {
      throw new Error(`tar extraction failed with exit code ${result.status}`);
    }

    // Verify extraction produced the expected xcframework structure
    const xcfwPath = path.join(tmpExtractDir, 'React.xcframework');
    const modulemapPath = path.join(xcfwPath, 'Modules', 'module.modulemap');
    if (!fs.existsSync(modulemapPath)) {
      throw new Error(
        `Extraction verification failed: ${modulemapPath} not found`,
      );
    }

    // Move from temp to final location
    console.log('Preparing the final location', finalLocation);
    fs.rmSync(finalLocation, {force: true, recursive: true});

    // Use mv for an atomic-ish replacement. If the final location is on the
    // same filesystem as tmpDir this is a rename; otherwise it falls back to
    // copy + delete via spawnSync.
    const mvResult = spawnSync('mv', [tmpExtractDir, finalLocation], {
      stdio: 'inherit',
    });

    if (mvResult.status !== 0) {
      // Fallback: copy recursively then remove temp
      console.log('mv failed, falling back to cp -R');
      fs.mkdirSync(finalLocation, {recursive: true});
      const cpResult = spawnSync(
        'cp',
        ['-R', tmpExtractDir + '/.', finalLocation],
        {stdio: 'inherit'},
      );
      if (cpResult.status !== 0) {
        throw new Error(`cp fallback failed with exit code ${cpResult.status}`);
      }
    }
  } finally {
    // Clean up temp directory
    fs.rmSync(tmpDir, {force: true, recursive: true});
  }
}

function updateLastBuildConfiguration(configuration /*: string */) {
  console.log(`Updating ${LAST_BUILD_FILENAME} with ${configuration}`);
  fs.writeFileSync(LAST_BUILD_FILENAME, configuration);
}

function main(
  configuration /*: string */,
  version /*: string */,
  podsRoot /*: string */,
) {
  validateBuildConfiguration(configuration);
  validateVersion(version);

  if (!shouldReplaceRnCoreConfiguration(configuration)) {
    return;
  }

  replaceRNCoreConfiguration(configuration, version, podsRoot);
  updateLastBuildConfiguration(configuration);
  console.log('Done replacing React Native prebuilt');
}

// This script is executed in the Pods folder, which is usually not synched to Github, so it should be ok
const argv = yargs
  .option('c', {
    alias: 'configuration',
    description:
      'Configuration to use to download the right React-Core prebuilt version. Allowed values are "Debug" and "Release".',
  })
  .option('r', {
    alias: 'reactNativeVersion',
    description:
      'The Version of React Native associated with the React-Core prebuilt tarball.',
  })
  .option('p', {
    alias: 'podsRoot',
    description: 'The path to the Pods root folder',
  })
  .usage('Usage: $0 -c Debug -r <version> -p <path/to/react-native>').argv;

// $FlowFixMe[prop-missing]
const configuration = argv.configuration;
// $FlowFixMe[prop-missing]
const version = argv.reactNativeVersion;
// $FlowFixMe[prop-missing]
const podsRoot = argv.podsRoot;

main(configuration, version, podsRoot);
