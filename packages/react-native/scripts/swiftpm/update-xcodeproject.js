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
 * Script to update Xcode project settings for SwiftPM build from source
 *
 * This script handles updating Xcode project configurations, particularly:
 * - REACT_NATIVE_PATH settings
 * - Build settings for SwiftPM compatibility
 * - Other project-specific configurations
 */

const {
  addLocalSwiftPM,
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
  updateXcodeProject,
} = require('./xcodeproj-utils');
const fs = require('fs');
const path = require('path');

/*::
type SwiftPackage = {
  relativePath: string,
  targets: Array<string>,
};
*/

/**
 * Integrate Swift packages into Xcode project
 * @param {string} xcodeProjectPath - Path to the app.xcodeproj file
 * @param {Array<Object>} packageSwiftObjects - List of PackageSwift objects with relativePath and targets
 * @param {string} appTargetName - Name of the app target
 */
function integrateSwiftPackagesInXcode(
  xcodeProjectPath /*: string */,
  packageSwiftObjects /*: Array<SwiftPackage> */,
  appTargetName /*: string */,
) /*: void */ {
  // Construct path to project.pbxproj
  const projectPbxprojPath = path.join(xcodeProjectPath, 'project.pbxproj');

  if (!fs.existsSync(projectPbxprojPath)) {
    throw new Error(`Project file not found: ${projectPbxprojPath}`);
  }

  // Convert to JSON
  const xcodeProject = convertXcodeProjectToJSON(projectPbxprojPath);

  // Remove any existing SwiftPM integrations first
  deintegrateSwiftPM(xcodeProject);

  // Iterate over PackageSwift objects and execute addLocalSwiftPM
  for (const packageSwift of packageSwiftObjects) {
    addLocalSwiftPM(
      packageSwift.relativePath,
      packageSwift.targets,
      xcodeProject,
      appTargetName,
    );
  }

  // Convert back to text format and write to project.pbxproj file
  fs.writeFileSync(
    projectPbxprojPath,
    updateXcodeProject(xcodeProject, projectPbxprojPath),
  );
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(
      'Usage: node update-xcodeproject.js <xcodeProjectPath> <appTargetName> <packageSwiftObjectsJSON>',
    );
    console.log(
      'Example: node update-xcodeproject.js ./MyApp.xcodeproj MyApp \'[{"relativePath":"../react-native","targets":["ReactCommon","React-Core"]}]\'',
    );
    process.exit(1);
  }

  const xcodeProjectPath = args[0];
  const appTargetName = args[1];
  const packageSwiftObjectsJSON = args[2];

  try {
    const packageSwiftObjects = JSON.parse(packageSwiftObjectsJSON);
    integrateSwiftPackagesInXcode(
      xcodeProjectPath,
      packageSwiftObjects,
      appTargetName,
    );
    console.log('✅ Successfully integrated Swift packages into Xcode project');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  integrateSwiftPackagesInXcode,
};
