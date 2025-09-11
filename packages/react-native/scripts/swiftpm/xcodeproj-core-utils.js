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

/*::
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
 * Generates a formatted string representation of a file for a build phase in Xcode project
 *
 * @param {string} objectId - The unique identifier of the Xcode object
 * @param {Object} objectData - The data associated with the Xcode object
 * @param {Object} allObjects - Dictionary of all Xcode objects indexed by their IDs
 * @returns {string} A formatted string representing the file in a build phase
 */
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

/**
 * Add missing sections to the textual project in the correct order
 * @param {string} textualProject - The textual representation of the Xcode project
 * @param {Array} sectionsToAdd - Array of sections to add with their content
 * @returns {string} Updated textual project with new sections added
 */
function addMissingSections(
  textualProject /*: string */,
  sectionsToAdd /*: Array<SectionToAdd> */,
) /*: string */ {
  // Define the order of sections - PBXBuildFile first, then XCLocalSwiftPackageReference, then XCSwiftPackageProductDependency
  const sectionOrder = [
    'PBXBuildFile',
    'XCLocalSwiftPackageReference',
    'XCSwiftPackageProductDependency',
  ];

  // Sort sections according to the defined order
  sectionsToAdd.sort((a, b) => {
    const indexA = sectionOrder.indexOf(a.sectionType);
    const indexB = sectionOrder.indexOf(b.sectionType);
    return indexA - indexB;
  });

  // Find the insertion points for each section type
  const lines = textualProject.split('\n');
  let insertionIndex = -1;

  for (const sectionToAdd of sectionsToAdd) {
    const {sectionType, replacementText} = sectionToAdd;

    if (sectionType === 'PBXBuildFile') {
      // PBXBuildFile should be first in the objects array
      // Find the first existing section after "objects = {"
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('objects = {')) {
          insertionIndex = i + 1;
          break;
        }
      }
    } else if (sectionType === 'XCLocalSwiftPackageReference') {
      // Should be second-last before rootObject
      // Find the rootObject line and go back to find a good insertion point
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('rootObject =')) {
          insertionIndex = i - 1;
          break;
        }
      }
    } else if (sectionType === 'XCSwiftPackageProductDependency') {
      // Should be last before rootObject
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('rootObject =')) {
          insertionIndex = i - 1;
          break;
        }
      }
    }

    // Insert the section at the determined index
    if (insertionIndex !== -1) {
      lines.splice(insertionIndex, 0, replacementText);
      // Update insertion index for subsequent sections
      insertionIndex += replacementText.split('\n').length;
    }
  }

  return lines.join('\n');
}

module.exports = {
  generateXcodeObjectId,
  printPBXBuildFile,
  printFilesForBuildPhase,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency,
  addMissingSections,
};
