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
  allowNonModularHeaderImport,
  configureAppForSwift,
  createHardlinks,
  findXcodeProjectDirectory,
  fixReactNativePath,
  generateCodegenArtifacts,
  integrateSwiftPMPackages,
  openXcodeProject,
  prepareHeaders,
  runIosPrebuild,
  runPodDeintegrate,
  setBuildFromSource,
} = require('./prepare-app-utils');
const fs = require('fs');
const path = require('path');

/*::
type SwiftPackage = {
  relativePath: string,
  targets: Array<string>,
};
*/

/**
 * Main function to prepare the app
 * @param {string} appPath - Path to the app (e.g., '../../private/helloworld')
 * @param {string} reactNativePath - Path to the React Native package (e.g., '.')
 * @param {string} appXcodeProject - Name of the Xcode project (e.g., 'HelloWorld.xcodeproj')
 * @param {string} targetName - Name of the app target (e.g., 'HelloWorld')
 */
async function prepareApp(
  appPath /*: string */ = '../../private/helloworld',
  reactNativePath /*: string */ = '.',
  appXcodeProject /*: string */ = 'HelloWorld.xcodeproj',
  targetName /*: string */ = 'HelloWorld',
  additionalPackages /*: Array<SwiftPackage> */ = [],
) /*: Promise<void> */ {
  console.log('🚀 Starting app preparation for SwiftPM build from source...');

  // Resolve absolute paths
  const absoluteAppPath = path.resolve(appPath);
  const absoluteReactNativePath = path.resolve(reactNativePath);

  // Search for the Xcode project within the app path instead of assuming it's in 'ios' folder
  const appIosPath = findXcodeProjectDirectory(
    absoluteAppPath,
    appXcodeProject,
  );

  console.log(`App path: ${absoluteAppPath}`);
  console.log(`React Native path: ${absoluteReactNativePath}`);
  console.log(`App iOS path: ${appIosPath}`);

  // Validate paths exist
  if (!fs.existsSync(absoluteAppPath)) {
    throw new Error(`App path does not exist: ${absoluteAppPath}`);
  }

  if (!fs.existsSync(appIosPath)) {
    throw new Error(`App iOS path does not exist: ${appIosPath}`);
  }

  try {
    // Step 1: Pod deintegrate from app directory
    console.log('\n📦 Step 1: Running pod deintegrate...');
    await runPodDeintegrate(appIosPath);

    // Step 2: Run iOS prebuild with environment variables
    console.log('\n🏗️  Step 2: Running iOS prebuild...');
    await runIosPrebuild(absoluteReactNativePath);

    // Step 3: Configure app for Swift integration
    console.log('\n🏗️  Step 3: Configuring app for Swift integration...');
    await configureAppForSwift(absoluteReactNativePath);

    // Step 4: Modify BUILD_FROM_SOURCE setting
    console.log('\n⚙️  Step 4: Setting BUILD_FROM_SOURCE to true...');
    await setBuildFromSource(absoluteReactNativePath);

    // Step 5: Create hard links
    console.log('\n🔗 Step 5: Creating hard links...');
    await createHardlinks(absoluteReactNativePath);

    // Step 6: Generate codegen artifacts
    console.log('\n🧬 Step 6: Generating codegen artifacts...');
    await generateCodegenArtifacts(
      absoluteReactNativePath,
      absoluteAppPath,
      appIosPath,
    );

    // Step 7: Prepare app dependencies headers (3 times)
    console.log('\n📂 Step 7: Preparing app dependencies headers...');
    await prepareHeaders(absoluteReactNativePath, appIosPath);

    // Step 8: Fix REACT_NATIVE_PATH in Xcode project
    console.log('\n🔧 Step 8: Fixing REACT_NATIVE_PATH in Xcode project...');
    await fixReactNativePath(
      appIosPath,
      absoluteReactNativePath,
      appXcodeProject,
    );

    // Step 9: Allow non-modular header imports in Xcode project
    console.log(
      '\n🔧 Step 9: Allowing non-modular header imports in Xcode project...',
    );
    await allowNonModularHeaderImport(appIosPath, appXcodeProject);

    // Step 10: Integrate SwiftPM packages in Xcode
    console.log('\n📦 Step 10: Integrating SwiftPM packages in Xcode...');
    await integrateSwiftPMPackages(
      appIosPath,
      absoluteReactNativePath,
      absoluteAppPath,
      appXcodeProject,
      targetName,
      additionalPackages,
    );

    // Step 11: Open Xcode project
    console.log('\n📱 Step 11: Opening Xcode project...');
    await openXcodeProject(appIosPath, appXcodeProject);

    console.log('\n✅ App preparation completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during app preparation:', error.message);
    throw error;
  }
}

module.exports = {
  prepareApp,
};
