/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const crypto = require('crypto');
const {execSync} = require('child_process');

/**
 * Generate a random string of 24 HEX characters (capital letters) for Xcode object IDs
 * @returns {string} A 24-character hexadecimal string in uppercase
 */
function generateXcodeObjectId() {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

/**
 * Convert Xcode project.pbxproj file to JSON format
 * @param {string} projectPath - Path to the project.pbxproj file
 * @returns {Object} Parsed JSON object of the Xcode project
 */
function convertXcodeProjectToJSON(projectPath) {
  const command = `plutil -convert json -o - "${projectPath}"`;
  const jsonOutput = execSync(command, { encoding: 'utf8' });
  return JSON.parse(jsonOutput);
}

/**
 * Remove all existing SwiftPM package references and dependencies from Xcode project
 * @param {Object} xcodeProject - The xcode project converted in JSON format
 */
function deintegrateSwiftPM(xcodeProject) {
  const objects = xcodeProject.objects;
  const objectsToRemove = [];

  // Step 1: Find all PBXNativeTarget objects and clean up their SwiftPM dependencies
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa === "PBXNativeTarget") {
      // Find PBXFrameworksBuildPhase
      for (const buildPhaseId of object.buildPhases || []) {
        const buildPhaseObject = objects[buildPhaseId];
        if (buildPhaseObject && buildPhaseObject.isa === "PBXFrameworksBuildPhase") {
          const filesToRemove = [];

          // Check each file in the build phase
          for (const fileId of buildPhaseObject.files || []) {
            const buildFileObject = objects[fileId];
            if (buildFileObject && buildFileObject.isa === "PBXBuildFile" && buildFileObject.productRef) {
              const productRefObject = objects[buildFileObject.productRef];
              if (productRefObject && productRefObject.isa === "XCSwiftPackageProductDependency") {
                // Mark for removal: the product dependency, the build file, and remove from files list
                objectsToRemove.push(buildFileObject.productRef);
                objectsToRemove.push(fileId);
                filesToRemove.push(fileId);
              }
            }
          }

          // Remove files from the build phase
          if (filesToRemove.length > 0) {
            buildPhaseObject.files = (buildPhaseObject.files || []).filter(fileId => !filesToRemove.includes(fileId));
          }
        }
      }
    }
  }

  // Step 2: Find PBXProject and clean up packageReferences
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa === "PBXProject") {
      const packageReferencesToRemove = [];

      // Check each package reference
      for (const packageRefId of object.packageReferences || []) {
        const packageRefObject = objects[packageRefId];
        if (packageRefObject && packageRefObject.isa === "XCLocalSwiftPackageReference") {
          // Mark for removal
          objectsToRemove.push(packageRefId);
          packageReferencesToRemove.push(packageRefId);
        }
      }

      // Remove package references from the project
      if (packageReferencesToRemove.length > 0) {
        object.packageReferences = (object.packageReferences || []).filter(refId => !packageReferencesToRemove.includes(refId));
      }

      break;
    }
  }

  // Step 3: Remove all marked objects
  for (const objectId of objectsToRemove) {
    delete objects[objectId];
  }

  console.log(`✓ Removed ${objectsToRemove.length} SwiftPM-related objects from Xcode project`);
}

/**
 * Add local SwiftPM package references and product dependencies to Xcode project
 * @param {string} relativePath - The relative path of where the Package.swift is located
 * @param {Array<string>} productNames - List of product names exposed by the Package.swift files
 * @param {Object} xcodeProject - The xcode project converted in JSON format
 * @param {string} targetName - The name of the target to add dependencies to
 */
function addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName) {
  // For the relative path: create XCLocalSwiftPackageReference
  const packageReferenceId = generateXcodeObjectId();
  xcodeProject.objects[packageReferenceId] = {
    "isa": "XCLocalSwiftPackageReference",
    "relativePath": relativePath
  };

  // Find PBXProject object and update packageReferences
  const objects = xcodeProject.objects;
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa === "PBXProject") {
      if (!object.packageReferences) {
        object.packageReferences = [];
      }
      object.packageReferences.push(packageReferenceId);
      break;
    }
  }

  // For each product: create XCSwiftPackageProductDependency and PBXBuildFile
  for (const productName of productNames) {
    // Generate XcodeID for XCSwiftPackageProductDependency
    const productDependencyId = generateXcodeObjectId();
    xcodeProject.objects[productDependencyId] = {
      "isa": "XCSwiftPackageProductDependency",
      "productName": productName
    };

    // Generate second XcodeID for PBXBuildFile
    const buildFileId = generateXcodeObjectId();
    xcodeProject.objects[buildFileId] = {
      "isa": "PBXBuildFile",
      "productRef": productDependencyId
    };

    // Find PBXNativeTarget with matching name
    for (const objectId in objects) {
      const object = objects[objectId];
      if (object.isa === "PBXNativeTarget" && object.name === targetName) {
        // Iterate over buildPhases to find PBXFrameworksBuildPhase
        for (const buildPhaseId of object.buildPhases) {
          const buildPhaseObject = objects[buildPhaseId];
          if (buildPhaseObject && buildPhaseObject.isa === "PBXFrameworksBuildPhase") {
            // Add buildFileId to the files array
            if (!buildPhaseObject.files) {
              buildPhaseObject.files = [];
            }
            buildPhaseObject.files.push(buildFileId);
            break;
          }
        }
        break;
      }
    }
  }
}

/**
 * Integrate Swift packages into Xcode project
 * @param {string} xcodeProjectPath - Path to the app.xcodeproj file
 * @param {Array<Object>} packageSwiftObjects - List of PackageSwift objects with relativePath and targets
 * @param {string} appTargetName - Name of the app target
 */
function integrateSwiftPackagesInXcode(xcodeProjectPath, packageSwiftObjects, appTargetName) {
  const fs = require('fs');
  const path = require('path');

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
      appTargetName
    );
  }

  // Write JSON directly to the project.pbxproj file
  fs.writeFileSync(projectPbxprojPath, JSON.stringify(xcodeProject));
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node update-xcodeproject.js <xcodeProjectPath> <appTargetName> <packageSwiftObjectsJSON>');
    console.log('Example: node update-xcodeproject.js ./MyApp.xcodeproj MyApp \'[{"relativePath":"../react-native","targets":["ReactCommon","React-Core"]}]\'');
    process.exit(1);
  }

  const xcodeProjectPath = args[0];
  const appTargetName = args[1];
  const packageSwiftObjectsJSON = args[2];

  try {
    const packageSwiftObjects = JSON.parse(packageSwiftObjectsJSON);
    integrateSwiftPackagesInXcode(xcodeProjectPath, packageSwiftObjects, appTargetName);
    console.log('✅ Successfully integrated Swift packages into Xcode project');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  generateXcodeObjectId,
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
  addLocalSwiftPM,
  integrateSwiftPackagesInXcode
};
