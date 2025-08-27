/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * Script to automatically prepare an app for building from source with SwiftPM
 *
 * This script automates the steps described in:
 * private/helloworld/ios/to-remove-instructions-to-build-from-source-with-spm
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// Import functions from other scripts
const {
  prepareAppDependenciesHeaders,
  hardlinkReactNativeHeaders,
  hardlinkThirdPartyDependenciesHeaders,
} = require('./prepare-app-dependencies-headers');
const {createSymlinks: createSymlinksFunction} = require('./create-symlinks');
const {integrateSwiftPackagesInXcode} = require('./update-xcodeproject');
const codegenExecutor = require('../codegen/generate-artifacts-executor');

/**
 * Find the directory containing the Xcode project within the app path
 * @param {string} appPath - The root app path to search in
 * @param {string} xcodeProjectName - The name of the Xcode project file (e.g., 'HelloWorld.xcodeproj')
 * @returns {string} - The path to the directory containing the Xcode project
 */
function findXcodeProjectDirectory(appPath, xcodeProjectName) {
  try {
    // Use find command to search for the Xcode project
    const findCommand = `find "${appPath}" -name "${xcodeProjectName}" -type d -print`;
    const result = execSync(findCommand, {encoding: 'utf8'}).trim();

    if (!result) {
      throw new Error(
        `Xcode project '${xcodeProjectName}' not found in '${appPath}' or its subdirectories`,
      );
    }

    // Return the directory containing the Xcode project (parent of the .xcodeproj file)
    return path.dirname(result);
  } catch (error) {
    throw new Error(
      `Failed to find Xcode project '${xcodeProjectName}': ${error.message}`,
    );
  }
}

/**
 * Main function to prepare the app
 * @param {string} appPath - Path to the app (e.g., '../../private/helloworld')
 * @param {string} reactNativePath - Path to the React Native package (e.g., '.')
 * @param {string} appXcodeProject - Name of the Xcode project (e.g., 'HelloWorld.xcodeproj')
 * @param {string} targetName - Name of the app target (e.g., 'HelloWorld')
 */
async function prepareApp(
  appPath = '../../private/helloworld',
  reactNativePath = '.',
  appXcodeProject = 'HelloWorld.xcodeproj',
  targetName = 'HelloWorld',
) {
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

    // Step 9: Integrate SwiftPM packages in Xcode
    console.log('\n📦 Step 9: Integrating SwiftPM packages in Xcode...');
    await integrateSwiftPMPackages(
      appIosPath,
      absoluteReactNativePath,
      absoluteAppPath,
      appXcodeProject,
      targetName,
    );

    // Step 10: Open Xcode project
    console.log('\n📱 Step 10: Opening Xcode project...');
    await openXcodeProject(appIosPath, appXcodeProject);

    console.log('\n✅ App preparation completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during app preparation:', error.message);
    throw error;
  }
}

/**
 * Run pod deintegrate from app directory
 */
async function runPodDeintegrate(appIosPath) {
  try {
    console.log(`Running pod deintegrate in: ${appIosPath}`);
    execSync('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    console.log('✓ Pod deintegrate completed');
  } catch (error) {
    console.warn(
      '⚠️  Pod deintegrate failed (this might be expected if no Podfile.lock exists)',
    );
  }
}

/**
 * Run iOS prebuild with environment variables
 */
async function runIosPrebuild(reactNativePath) {
  console.log('Running iOS prebuild with nightly versions...');

  const env = {
    ...process.env,
    RN_DEP_VERSION: 'nightly',
    HERMES_VERSION: 'nightly',
  };

  try {
    execSync('node scripts/ios-prebuild -s', {
      cwd: reactNativePath,
      env: env,
      stdio: 'inherit',
    });
    console.log('✓ iOS prebuild completed');
  } catch (error) {
    throw new Error(`iOS prebuild failed: ${error.message}`);
  }
}

/**
 * Configure app for Swift integration
 */
async function configureAppForSwift(reactNativePath) {
  try {
    console.log('Configuring app for Swift integration...');

    // 1. Create hardlink from React-umbrella.h to React-umbrella.h
    const sourceUmbrellaPath = path.join(
      reactNativePath,
      'scripts',
      'ios-prebuild',
      'React-umbrella.h',
    );
    const reactIncludesReactPath = path.join(
      reactNativePath,
      'React',
      'includes',
      'React',
    );
    const destUmbrellaPath = path.join(
      reactIncludesReactPath,
      'React-umbrella.h',
    );

    // Ensure the React/includes/React directory exists
    if (!fs.existsSync(reactIncludesReactPath)) {
      fs.mkdirSync(reactIncludesReactPath, {recursive: true});
    }

    // Remove existing hardlink if it exists
    if (fs.existsSync(destUmbrellaPath)) {
      fs.unlinkSync(destUmbrellaPath);
    }

    // Create hardlink for umbrella header
    if (fs.existsSync(sourceUmbrellaPath)) {
      fs.linkSync(sourceUmbrellaPath, destUmbrellaPath);
      console.log(
        `✓ Created hardlink: React-umbrella.h -> ${path.relative(
          reactNativePath,
          sourceUmbrellaPath,
        )}`,
      );
    } else {
      throw new Error(
        `Source umbrella header not found: ${sourceUmbrellaPath}`,
      );
    }

    // 2. Generate module.modulemap file
    const reactIncludesPath = path.join(reactNativePath, 'React', 'includes');
    const moduleMapPath = path.join(reactIncludesPath, 'module.modulemap');
    const absoluteUmbrellaPath = path.join(reactNativePath, 'React', 'includes', 'React', 'React-umbrella.h');
    const moduleMapContent = `framework module React {
  umbrella header "${absoluteUmbrellaPath}"
  export *
  module * { export * }
}
`;

    fs.writeFileSync(moduleMapPath, moduleMapContent, 'utf8');
    console.log('✓ Generated module.modulemap file');

    console.log('✓ App configured for Swift integration');
  } catch (error) {
    throw new Error(`Swift configuration failed: ${error.message}`);
  }
}

/**
 * Set BUILD_FROM_SOURCE to true in Package.swift
 */
async function setBuildFromSource(reactNativePath) {
  const packageSwiftPath = path.join(reactNativePath, 'Package.swift');

  if (!fs.existsSync(packageSwiftPath)) {
    throw new Error(`Package.swift not found at: ${packageSwiftPath}`);
  }

  try {
    console.log(`Updating BUILD_FROM_SOURCE in: ${packageSwiftPath}`);

    const content = fs.readFileSync(packageSwiftPath, 'utf8');

    // Check if BUILD_FROM_SOURCE = false exists and replace it with true
    if (content.includes('let BUILD_FROM_SOURCE = false')) {
      const updatedContent = content.replace(
        /let BUILD_FROM_SOURCE = false/g,
        'let BUILD_FROM_SOURCE = true',
      );
      fs.writeFileSync(packageSwiftPath, updatedContent, 'utf8');
      console.log('✓ BUILD_FROM_SOURCE set to true in Package.swift');
    } else if (content.includes('let BUILD_FROM_SOURCE = true')) {
      console.log(
        '✓ BUILD_FROM_SOURCE is already set to true in Package.swift',
      );
    } else {
      console.warn(
        '⚠️  BUILD_FROM_SOURCE declaration not found in Package.swift',
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to update BUILD_FROM_SOURCE in Package.swift: ${error.message}`,
    );
  }
}

/**
 * Create hard links for React Native headers in React/includes
 */
async function createHardlinks(reactNativePath) {
  try {
    console.log('Creating hard links for React Native headers...');
    const reactIncludesPath = path.join(reactNativePath, 'React');
    hardlinkReactNativeHeaders(reactNativePath, reactIncludesPath, 'includes');
    console.log('✓ React Native hard links created in React/includes');

    console.log('Creating hard links for third-party dependencies...');
    hardlinkThirdPartyDependenciesHeaders(reactNativePath, reactIncludesPath, 'includes');
    console.log('✓ Third-party dependencies hard links created in React/includes');
  } catch (error) {
    throw new Error(`Hard link creation failed: ${error.message}`);
  }
}

/**
 * Generate codegen artifacts using the executor
 */
async function generateCodegenArtifacts(reactNativePath, appPath, appIosPath) {
  try {
    console.log('Generating codegen artifacts...');

    // Use the codegen executor directly
    codegenExecutor.execute(appPath, 'ios', appIosPath, 'app');

    console.log('✓ Codegen artifacts generated');
  } catch (error) {
    throw new Error(`Codegen generation failed: ${error.message}`);
  }
}

/**
 * Prepare app dependencies headers (3 separate calls)
 */
async function prepareHeaders(reactNativePath, appIosPath) {
  const outputFolder = path.join(
    appIosPath,
    'build',
    'generated',
    'ios',
    'ReactAppDependencyProvider',
  );
  const codegenOutputFolder = path.join(
    appIosPath,
    'build',
    'generated',
    'ios',
    'ReactCodegen',
  );

  try {
    // 1. Prepare codegen headers
    console.log('Preparing codegen headers...');
    prepareAppDependenciesHeaders(
      reactNativePath,
      appIosPath,
      outputFolder,
      'codegen',
    );
    console.log('✓ Codegen headers prepared');

    // 2. Prepare react-native headers
    console.log('Preparing react-native headers...');
    prepareAppDependenciesHeaders(
      reactNativePath,
      appIosPath,
      codegenOutputFolder,
      'react-native',
    );
    console.log('✓ React Native headers prepared');

    // 3. Prepare third-party dependencies headers
    console.log('Preparing third-party dependencies headers...');
    prepareAppDependenciesHeaders(
      reactNativePath,
      appIosPath,
      codegenOutputFolder,
      'third-party-dependencies',
    );
    console.log('✓ Third-party dependencies headers prepared');
  } catch (error) {
    throw new Error(`Header preparation failed: ${error.message}`);
  }
}

/**
 * Fix REACT_NATIVE_PATH in Xcode project
 */
async function fixReactNativePath(
  appIosPath,
  reactNativePath,
  appXcodeProject,
) {
  const projectPath = path.join(appIosPath, appXcodeProject, 'project.pbxproj');

  if (!fs.existsSync(projectPath)) {
    throw new Error(`Xcode project file not found: ${projectPath}`);
  }

  try {
    console.log('Fixing REACT_NATIVE_PATH in Xcode project...');

    // Calculate the relative path from iOS app to React Native package
    const relativePath = path.relative(appIosPath, reactNativePath);
    const newReactNativePath = `"${relativePath}"`;

    // Read the project file
    let content = fs.readFileSync(projectPath, 'utf8');

    // Apply the sed replacements
    // Fix the first pattern (the incomplete one from the instructions)
    content = content.replace(
      /REACT_NATIVE_PATH = "\${PODS_ROOT}\/\.\.\/\.\.\/\.\.\/react-native";/g,
      `REACT_NATIVE_PATH = "\${PROJECT_DIR}/${relativePath}";`,
    );

    // Fix the second pattern
    content = content.replace(
      /REACT_NATIVE_PATH = "\${PODS_ROOT}\/\.\.\/\.\.\/\.\.\/\.\.\/packages\/react-native";/g,
      `REACT_NATIVE_PATH = "\${PROJECT_DIR}/${relativePath}";`,
    );

    // Write the updated content back
    fs.writeFileSync(projectPath, content, 'utf8');

    console.log(
      `✓ REACT_NATIVE_PATH fixed to: \${PROJECT_DIR}/${relativePath}`,
    );
  } catch (error) {
    throw new Error(`Failed to fix REACT_NATIVE_PATH: ${error.message}`);
  }
}

/**
 * Integrate SwiftPM packages into Xcode project
 */
async function integrateSwiftPMPackages(
  appIosPath,
  reactNativePath,
  appPath,
  appXcodeProject,
  targetName,
) {
  try {
    console.log('Preparing SwiftPM package integrations...');

    // Calculate relative paths from appIosPath
    const relativeReactNativePath = path.relative(appIosPath, reactNativePath);
    const relativeGeneratedPath = path.join('build', 'generated', 'ios');

    // Create PackageSwift objects
    const packageSwiftObjects = [
      {
        relativePath: relativeReactNativePath,
        targets: ['React'],
      },
      {
        relativePath: relativeGeneratedPath,
        targets: ['ReactCodegen', 'ReactAppDependencyProvider'],
      },
    ];

    const xcodeProjectPath = path.join(appIosPath, appXcodeProject);

    // Call integrateSwiftPackagesInXcode function
    integrateSwiftPackagesInXcode(
      xcodeProjectPath,
      packageSwiftObjects,
      targetName,
    );

    console.log('✓ SwiftPM packages integrated into Xcode project');
  } catch (error) {
    throw new Error(`SwiftPM integration failed: ${error.message}`);
  }
}

/**
 * Open Xcode project
 */
async function openXcodeProject(appIosPath, appXcodeProject) {
  const xcodeProjectPath = path.join(appIosPath, appXcodeProject);

  if (!fs.existsSync(xcodeProjectPath)) {
    throw new Error(`Xcode project not found: ${xcodeProjectPath}`);
  }

  try {
    console.log(`Opening Xcode project: ${xcodeProjectPath}`);
    execSync(`open "${xcodeProjectPath}"`, {
      stdio: 'inherit',
    });
    console.log('✓ Xcode project opened');
  } catch (error) {
    throw new Error(`Failed to open Xcode project: ${error.message}`);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  let appPath = '../../private/helloworld';
  let reactNativePath = '.';
  let appXcodeProject = 'HelloWorld.xcodeproj';
  let targetName = 'HelloWorld';

  if (args.length >= 1) {
    appPath = args[0];
  }

  if (args.length >= 2) {
    reactNativePath = args[1];
  }

  if (args.length >= 3) {
    appXcodeProject = args[2];
  }

  if (args.length >= 4) {
    targetName = args[3];
  }

  console.log(
    'Usage: node prepare-app.js [appPath] [reactNativePath] [appXcodeProject] [targetName]',
  );
  console.log(`Using App path: ${appPath}`);
  console.log(`Using React Native path: ${reactNativePath}`);
  console.log(`Using App Xcode project: ${appXcodeProject}`);
  console.log(`Using Target name: ${targetName}`);

  prepareApp(appPath, reactNativePath, appXcodeProject, targetName)
    .then(() => {
      console.log(
        '\n🎉 All done! Your app is ready for SwiftPM build from source.',
      );
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Preparation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  prepareApp,
  runPodDeintegrate,
  runIosPrebuild,
  configureAppForSwift,
  setBuildFromSource,
  createHardlinks,
  generateCodegenArtifacts,
  prepareHeaders,
  fixReactNativePath,
  integrateSwiftPMPackages,
  openXcodeProject,
};
