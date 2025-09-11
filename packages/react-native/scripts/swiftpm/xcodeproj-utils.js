/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {execSync} = require('child_process');
const crypto = require('crypto');

/*::
type XcodeProject = {
  // $FlowFixMe[unclear-type]
  objects: {[string]: any},
  // $FlowFixMe[unclear-type]
  [string]: any,
};
*/

/**
 * Generate a random string of 24 HEX characters (capital letters) for Xcode object IDs
 * @returns {string} A 24-character hexadecimal string in uppercase
 */
function generateXcodeObjectId() /*: string */ {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

/**
 * Convert Xcode project.pbxproj file to JSON format
 * @param {string} projectPath - Path to the project.pbxproj file
 * @returns {Object} Parsed JSON object of the Xcode project
 */
function convertXcodeProjectToJSON(
  projectPath /*: string */,
) /*: XcodeProject */ {
  const command = `plutil -convert json -o - "${projectPath}"`;
  const jsonOutput = execSync(command, {encoding: 'utf8'});
  return JSON.parse(jsonOutput);
}

/**
 * Remove all existing local SwiftPM package references and dependencies from Xcode project
 * @param {Object} xcodeProject - The xcode project converted in JSON format
 */
function deintegrateSwiftPM(xcodeProject /*: XcodeProject */) /*: void */ {
  const objects = xcodeProject.objects;
  const objectsToRemove = [];

  // Step 1: Find all PBXNativeTarget objects and clean up their SwiftPM dependencies
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa !== 'PBXNativeTarget') continue;

    // Find PBXFrameworksBuildPhase
    for (const buildPhaseId of object.buildPhases || []) {
      const buildPhaseObject = objects[buildPhaseId];
      if (
        !buildPhaseObject ||
        buildPhaseObject.isa !== 'PBXFrameworksBuildPhase'
      )
        continue;

      const filesToRemove /*: Array<string> */ = [];

      // Check each file in the build phase
      for (const fileId of buildPhaseObject.files || []) {
        const buildFileObject = objects[fileId];
        if (
          !buildFileObject ||
          buildFileObject.isa !== 'PBXBuildFile' ||
          !buildFileObject.productRef
        )
          continue;

        const productRefObject = objects[buildFileObject.productRef];
        if (
          !productRefObject ||
          productRefObject.isa !== 'XCSwiftPackageProductDependency'
        )
          continue;

        // Mark for removal: the product dependency, the build file, and remove from files list
        objectsToRemove.push(buildFileObject.productRef);
        objectsToRemove.push(fileId);
        filesToRemove.push(fileId);
      }

      // Remove files from the build phase
      if (filesToRemove.length > 0) {
        buildPhaseObject.files = (buildPhaseObject.files || []).filter(
          fileId => !filesToRemove.includes(fileId),
        );
      }
    }
  }

  // Step 2: Find PBXProject and clean up packageReferences
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa !== 'PBXProject') continue;

    const packageReferencesToRemove = [];

    // Check each package reference
    for (const packageRefId of object.packageReferences || []) {
      const packageRefObject = objects[packageRefId];
      if (
        !packageRefObject ||
        packageRefObject.isa !== 'XCLocalSwiftPackageReference'
      )
        continue;

      // Mark for removal
      objectsToRemove.push(packageRefId);
      packageReferencesToRemove.push(packageRefId);
    }

    // Remove package references from the project
    if (packageReferencesToRemove.length > 0) {
      object.packageReferences = (object.packageReferences || []).filter(
        refId => !packageReferencesToRemove.includes(refId),
      );
    }

    break;
  }

  // Step 3: Remove all marked objects
  for (const objectId of objectsToRemove) {
    delete objects[objectId];
  }

  console.log(
    `✓ Removed ${objectsToRemove.length} SwiftPM-related objects from Xcode project`,
  );
}

module.exports = {
  generateXcodeObjectId,
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
};
