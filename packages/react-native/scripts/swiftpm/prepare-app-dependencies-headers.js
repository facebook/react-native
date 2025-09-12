/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {librariesMappings, reactMappings} = require('./headers-mappings');
const {
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
  symlinkReactCommonHeaders,
} = require('./headers-utils');
const fs = require('fs');
const path = require('path');

/**
 * Create symlinks for React Native headers in the output folder.
 * This function orchestrate the creation of all the headers required by React Native:
 * 1. It explores the `react-native/React` folder and creates links in the `output/React` folder
 *   i. While exploring the `react-native/React` folder, it special maps the FBReactNativeSpec folder
 * to `output/FBReactNativeSpec` folder
 * 2. It explores the `react-native/Libraries` folder, creating links to the headers in the
 * `output/React` folder
 *   i. While exploring the `react-native/Libraries` folder, it applies special mappings for: Required,
 * TypeSafety, FBLazyVector
 * 3. Then it calls the previously defined symlinkReactAppleHeaders to setup the ReactApple headers
 * 4. Then it calls the previously defined symlinkReactCommonHeaders to setup the ReactCommon headers
 *
 * @param {string} reactNativePath - Path to the React Native directory
 * @param {string} outputFolder - Path to the output folder
 * @param {string} folderName - Name of the folder where headers will be created (default: 'headers')
 */
function symlinkReactNativeHeaders(
  reactNativePath /*: string */,
  outputFolder /*: string */,
  folderName /*: string */ = 'headers',
) /*: void */ {
  console.log('Creating symlinks for React Native headers...');

  const headersOutput = path.join(outputFolder, folderName);
  if (!fs.existsSync(headersOutput)) {
    fs.mkdirSync(headersOutput, {recursive: true});
  }

  let totalLinkedCount = 0;

  // Create React subdirectory for React and Libraries headers
  const reactHeadersOutput = path.join(headersOutput, 'React');
  if (!fs.existsSync(reactHeadersOutput)) {
    fs.mkdirSync(reactHeadersOutput, {recursive: true});
  }

  const mappings = {
    ...reactMappings(reactNativePath, headersOutput),
    ...librariesMappings(reactNativePath, headersOutput),
  };

  // Iterate over the key-value pairs of the mappings object
  for (const [sourceDir, options] of Object.entries(mappings)) {
    symlinkHeadersFromPath(
      sourceDir,
      options.destination,
      options.preserveStructure,
      options.excludeFolders,
    );
  }

  // Process ReactApple folder - special structure preservation
  const reactApplePath = path.join(reactNativePath, 'ReactApple');
  if (fs.existsSync(reactApplePath)) {
    console.log('Processing ReactApple folder...');
    const reactAppleCount = symlinkReactAppleHeaders(
      reactApplePath,
      headersOutput,
    );
    totalLinkedCount += reactAppleCount;
    console.log(`Created ${reactAppleCount} symlinks from ReactApple folder`);
  }

  // Process ReactCommon folder - conditional structure preservation
  const reactCommonPath = path.join(reactNativePath, 'ReactCommon');
  if (fs.existsSync(reactCommonPath)) {
    console.log('Processing ReactCommon folder...');
    const reactCommonCount = symlinkReactCommonHeaders(
      reactCommonPath,
      headersOutput,
    );
    totalLinkedCount += reactCommonCount;
    console.log(`Created ${reactCommonCount} symlinks from ReactCommon folder`);
  }

  console.log(
    `Created symlinks for ${totalLinkedCount} React Native headers total`,
  );
}

module.exports = {
  symlinkReactNativeHeaders,
};
