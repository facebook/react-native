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

const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const tar = require('tar');

/**
 * Downloads hermes artifacts from the specified version and build type
 * @param {*} version
 * @param {*} buildType
 * @returns
 */
async function prepareHermesArtifactsAsync(
  version /*:string*/,
  buildType /*:string*/,
) /*:string*/ {
  // Check if the Hermes artifacts are already downloaded
  const artifactsPath = path.resolve(
    process.cwd(),
    '.build',
    'artifacts',
    `hermes`,
  );
  if (fs.existsSync(artifactsPath)) {
    return artifactsPath;
  }

  // Download the Hermes artifacts
  const url = getHermesArtifactsUrl(version, buildType);
  console.log(`Downloading Hermes artifacts from ${url}...`);

  // download the file pointed to by the URL and store it in the ./.build/artifacts folder on disk
  await downloadAndExtract(url, artifactsPath);
}

async function downloadAndExtract(url /*:string*/, targetFolder /*:string*/) {
  const buildDir = path.resolve('.build', 'artifacts');
  const tarballPath = path.join(buildDir, 'artifact.tar.gz');

  // Ensure build directory exists
  fs.mkdirSync(targetFolder, {recursive: true});

  // Download the file
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to download: ${response.statusText}`);

  // Save to disk
  const fileStream = fs.createWriteStream(tarballPath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  // Extract the tar.gz
  await tar.x({
    file: tarballPath,
    cwd: targetFolder,
  });

  // Delete the tarball after extraction
  fs.unlinkSync(tarballPath);

  console.log('Download and extraction complete.');
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
