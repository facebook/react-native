/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {
  hardlinkHeadersFromPath,
  hardlinkReactAppleHeaders,
  hardlinkReactCommonHeaders,
} = require('./headers-utils');
const fs = require('fs');
const path = require('path');

/**
 * Create hard links for React Native headers in the output folder.
 * This function orchestrate the creation of all the headers required by React Native:
 * 1. It explores the `react-native/React` folder and creates links in the `output/React` folder
 *   i. While exploring the `react-native/React` folder, it special maps the FBReactNativeSpec folder
 * to `output/FBReactNativeSpec` folder
 * 2. It explores the `react-native/Libraries` folder, creating links to the headers in the
 * `output/React` folder
 *   i. While exploring the `react-native/Libraries` folder, it applies special mappings for: Required,
 * TypeSafety, FBLazyVector
 * 3. Then it calls the previously defined hardlinkReactAppleHeaders to setup the ReactApple headers
 * 4. Then it calls the previously defined hardlinkReactCommonHeaders to setup the ReactCommon headers
 *
 * @param {string} reactNativePath - Path to the React Native directory
 * @param {string} outputFolder - Path to the output folder
 * @param {string} folderName - Name of the folder where headers will be created (default: 'headers')
 */
function hardlinkReactNativeHeaders(
  reactNativePath /*: string */,
  outputFolder /*: string */,
  folderName /*: string */ = 'headers',
) /*: void */ {
  console.log('Creating hard links for React Native headers...');

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

  // Define custom mappings for Libraries folder
  const reactMappings = {
    'FBReactNativeSpec/': path.join(headersOutput, 'FBReactNativeSpec'),
  };

  // 1. Process React folder - flatten structure, exclude 'includes', 'headers', and 'tests' folders
  const reactPath = path.join(reactNativePath, 'React');
  if (fs.existsSync(reactPath)) {
    console.log('Processing React folder...');
    const reactCount = hardlinkHeadersFromPath(
      reactPath,
      reactHeadersOutput,
      false,
      ['includes', 'headers', 'tests'],
      reactMappings,
    );
    totalLinkedCount += reactCount;
    console.log(`Created ${reactCount} hard links from React folder`);
  }

  // 2. Process Libraries folder with custom mapping for RCTRequired
  const librariesPath = path.join(reactNativePath, 'Libraries');
  if (fs.existsSync(librariesPath)) {
    console.log('Processing Libraries folder...');

    // Define custom mappings for Libraries folder
    const librariesMappings = {
      'Required/': path.join(headersOutput, 'RCTRequired'),
      'TypeSafety/': path.join(headersOutput, 'RCTTypeSafety'),
      'FBLazyVector/': path.join(headersOutput, 'FBLazyVector'),
    };

    const librariesCount = hardlinkHeadersFromPath(
      librariesPath,
      reactHeadersOutput,
      false,
      ['tests'],
      librariesMappings,
    );
    totalLinkedCount += librariesCount;
    console.log(`Created ${librariesCount} hard links from Libraries folder`);
  }

  // 3. Process ReactApple folder - special structure preservation
  const reactApplePath = path.join(reactNativePath, 'ReactApple');
  if (fs.existsSync(reactApplePath)) {
    console.log('Processing ReactApple folder...');
    const reactAppleCount = hardlinkReactAppleHeaders(
      reactApplePath,
      headersOutput,
    );
    totalLinkedCount += reactAppleCount;
    console.log(`Created ${reactAppleCount} hard links from ReactApple folder`);
  }

  // 4. Process ReactCommon folder - conditional structure preservation
  const reactCommonPath = path.join(reactNativePath, 'ReactCommon');
  if (fs.existsSync(reactCommonPath)) {
    console.log('Processing ReactCommon folder...');
    // Define paths that should be flattened in ReactCommon folder
    const flattenPaths = ['react/nativemodule/core/platform/ios'];
    // Define special mappings for flattening specific directories
    const specialMapping = {
      'yoga/': 'yoga',
      'cxxreact/': 'cxxreact',
      'jsinspector-modern/': 'jsinspector-modern',
      'jserrorhandler/': 'jserrorhandler',
      'oscompat/': 'oscompat',
    };
    const reactCommonCount = hardlinkReactCommonHeaders(
      reactCommonPath,
      headersOutput,
      flattenPaths,
      specialMapping,
    );
    totalLinkedCount += reactCommonCount;
    console.log(
      `Created ${reactCommonCount} hard links from ReactCommon folder`,
    );
  }

  console.log(
    `Created hard links for ${totalLinkedCount} React Native headers total`,
  );
}

module.exports = {
  hardlinkReactNativeHeaders,
};
