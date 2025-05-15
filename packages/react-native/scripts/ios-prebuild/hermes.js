/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

async function prepareHermesArtifactsAsync(
  version /*:string*/,
  buildType /*:string*/,
) /*: Promise<string> */ {
  // Check if the Hermes artifacts are already downloaded
  const artifactsPath /*: string*/ = path.resolve(
    process.cwd(),
    '.build',
    'artifacts',
    'hermes',
  );
  if (fs.existsSync(artifactsPath)) {
    return artifactsPath;
  }

  // Download the Hermes artifacts
  const url = getHermesArtifactsUrl(version, buildType);
  console.log(`Downloading Hermes artifacts from ${url}...`);

  // download the file pointed to by the URL and store it in the ./.build/artifacts folder on disk
  await downloadAndExtract(url, artifactsPath);
  return artifactsPath;
}

async function downloadAndExtract(url /*:string*/, targetFolder /*:string*/) {
  const buildDir = path.resolve('.build', 'artifacts');
  const tarballPath = path.join(buildDir, 'artifact.tar.gz');

  // Ensure build directory exists
  fs.mkdirSync(targetFolder, {recursive: true});

  console.log(`Downloading file from ${url} to ${tarballPath}...`);

  try {
    // Download the file using curl via execSync
    execSync(`curl -L "${url}" -o "${tarballPath}"`, {stdio: 'inherit'});

    console.log('Download complete. Extracting...');

    // Extract the tar.gz using execSync
    execSync(`tar -xzf "${tarballPath}" -C "${targetFolder}"`, {
      stdio: 'inherit',
    });

    // Delete the tarball after extraction
    fs.unlinkSync(tarballPath);

    console.log('Download and extraction complete.');
  } catch (error) {
    if (fs.existsSync(tarballPath)) {
      fs.unlinkSync(tarballPath);
    }
    throw new Error(`Failed to download or extract: ${error.message}`);
  }
}

function getHermesArtifactsUrl(
  version /*:string*/,
  buildType /*:string*/,
) /*:string*/ {
  // Define the URL for the Hermes artifacts
  // The URL format is:
  // https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/<version>/react-native-artifacts-<version>-hermes-ios-<buildType>.tar.gz
  // where <version> is the version of React Native and <buildType> is the build type (e.g., "debug" or "release")
  // The Maven repository URL and namespace
  // are hardcoded for simplicity, but they could be parameterized if needed
  const maven_repo_url = 'https://repo1.maven.org/maven2';
  const namespace = 'com/facebook/react';
  return `${maven_repo_url}/${namespace}/react-native-artifacts/${version}/react-native-artifacts-${version}-hermes-ios-${buildType}.tar.gz`;
}

module.exports = {
  prepareHermesArtifactsAsync,
};
