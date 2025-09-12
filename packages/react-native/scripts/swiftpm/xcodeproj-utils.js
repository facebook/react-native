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

type XcodeObject = {
  isa: string,
  // $FlowFixMe[unclear-type]
  [string]: any,
};

type SectionToAdd = {
  sectionType: string,
  replacementText: string,
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

/**
 * Print PBXBuildFile object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXBuildFile(
  objectId /*: string */,
  objectData /*: XcodeObject */,
  allObjects /*: {[string]: XcodeObject} */,
) /*: string */ {
  // Handle productRef case for Swift Package dependencies
  if (objectData.productRef) {
    const productRefObject = allObjects[objectData.productRef];
    const productName = productRefObject
      ? productRefObject.productName
      : 'Unknown';
    return `\t\t${objectId} /* ${productName} in Frameworks */ = {isa = PBXBuildFile; productRef = ${objectData.productRef} /* ${productName} */; };\n`;
  }

  // Handle fileRef case for regular files
  const referencedFile = allObjects[objectData.fileRef];
  const filename = referencedFile
    ? referencedFile.name || referencedFile.path || 'Unknown'
    : 'Unknown';

  // Determine the type by searching build phases
  let type = 'Unknown';
  for (const [, phaseObject] of Object.entries(allObjects)) {
    if (phaseObject.files && phaseObject.files.includes(objectId)) {
      // Check if the isa property ends up with "BuildPhase"
      if (phaseObject.isa.endsWith('BuildPhase')) {
        // remove the PBX prefix and the BuildPhase suffix
        type = phaseObject.isa.substring(3, phaseObject.isa.length - 10);
        break;
      }
    }
  }

  // Format the output as a single line
  return `\t\t${objectId} /* ${filename} in ${type} */ = {isa = PBXBuildFile; fileRef = ${objectData.fileRef} /* ${filename} */; };\n`;
}

/**
 * Print XCLocalSwiftPackageReference object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printXCLocalSwiftPackageReference(
  objectId /*: string */,
  objectData /*: XcodeObject */,
  allObjects /*: {[string]: XcodeObject} */,
) /*: string */ {
  const relativePath = objectData.relativePath;

  // Escape path with quotes if it contains spaces
  const escapedPath = relativePath.includes(' ')
    ? `"${relativePath}"`
    : relativePath;

  return `\t\t${objectId} /* XCLocalSwiftPackageReference "${relativePath}" */ = {
\t\t\tisa = XCLocalSwiftPackageReference;
\t\t\trelativePath = ${escapedPath};
\t\t};
`;
}

/**
 * Print XCSwiftPackageProductDependency object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printXCSwiftPackageProductDependency(
  objectId /*: string */,
  objectData /*: XcodeObject */,
  allObjects /*: {[string]: XcodeObject} */,
) /*: string */ {
  const productName = objectData.productName;

  return `\t\t${objectId} /* ${productName} */ = {
\t\t\tisa = XCSwiftPackageProductDependency;
\t\t\tproductName = ${productName};
\t\t};
`;
}

function printFilesForBuildPhase(
  objectId /*: string */,
  objectData /*: XcodeObject */,
  allObjects /*: {[string]: XcodeObject} */,
) /*: string */ {
  // Get the product name from the productRef in the PBXBuildFile
  let productName = 'Unknown';

  if (objectData.productRef) {
    const productRefObject = allObjects[objectData.productRef];
    if (productRefObject && productRefObject.productName) {
      productName = productRefObject.productName;
    }
  } else if (objectData.fileRef) {
    const fileRefObject = allObjects[objectData.fileRef];
    if (fileRefObject) {
      productName = fileRefObject.name || fileRefObject.path || 'Unknown';
    }
  }

  return `\t\t\t\t${objectId} /* ${productName} in Frameworks */,\n`;
}

module.exports = {
  generateXcodeObjectId,
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
  printPBXBuildFile,
  printFilesForBuildPhase,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency,
};
