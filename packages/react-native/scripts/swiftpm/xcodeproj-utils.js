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
  generateXcodeObjectId,
  printFilesForBuildPhase,
} = require('./xcodeproj-core-utils');
const {execSync} = require('child_process');

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
 * Add local SwiftPM package references and product dependencies to Xcode project
 * @param {string} relativePath - The relative path of where the Package.swift is located
 * @param {Array<string>} productNames - List of product names exposed by the Package.swift files
 * @param {Object} xcodeProject - The xcode project converted in JSON format
 * @param {string} targetName - The name of the target to add dependencies to
 */
function addLocalSwiftPM(
  relativePath /*: string */,
  productNames /*: Array<string> */,
  xcodeProject /*: XcodeProject */,
  targetName /*: string */,
) /*: void */ {
  // For the relative path: create XCLocalSwiftPackageReference
  const packageReferenceId = generateXcodeObjectId();
  xcodeProject.objects[packageReferenceId] = {
    isa: 'XCLocalSwiftPackageReference',
    relativePath: relativePath,
  };

  // Find PBXProject object and update packageReferences
  const objects = xcodeProject.objects;
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa !== 'PBXProject') continue;

    if (!object.packageReferences) {
      object.packageReferences = [];
    }
    object.packageReferences.push(packageReferenceId);
    break;
  }

  // For each product: create XCSwiftPackageProductDependency and PBXBuildFile
  for (const productName of productNames) {
    // Generate XcodeID for XCSwiftPackageProductDependency
    const productDependencyId = generateXcodeObjectId();
    xcodeProject.objects[productDependencyId] = {
      isa: 'XCSwiftPackageProductDependency',
      productName: productName,
    };

    // Generate second XcodeID for PBXBuildFile
    const buildFileId = generateXcodeObjectId();
    xcodeProject.objects[buildFileId] = {
      isa: 'PBXBuildFile',
      productRef: productDependencyId,
    };

    // Find PBXNativeTarget with matching name
    for (const objectId in objects) {
      const object = objects[objectId];
      if (object.isa !== 'PBXNativeTarget' || object.name !== targetName)
        continue;

      // Iterate over buildPhases to find PBXFrameworksBuildPhase
      for (const buildPhaseId of object.buildPhases) {
        const buildPhaseObject = objects[buildPhaseId];
        if (
          !buildPhaseObject ||
          buildPhaseObject.isa !== 'PBXFrameworksBuildPhase'
        )
          continue;

        // Add buildFileId to the files array
        if (!buildPhaseObject.files) {
          buildPhaseObject.files = [];
        }
        buildPhaseObject.files.push(buildFileId);
        break;
      }
      break;
    }
  }
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

/**
 * Update the PBXFrameworksBuildPhase.files array in the textual project
 * @param {string} textualProject - The textual representation of the Xcode project
 * @param {Object} xcodeProjectJSON - The JSON representation of the Xcode project
 * @returns {string} Updated textual project with new PBXFrameworksBuildPhase.files content
 */
function updatePBXFrameworksBuildPhaseFiles(
  textualProject /*: string */,
  xcodeProjectJSON /*: XcodeProject */,
) /*: string */ {
  const lines = textualProject.split('\n');
  const processedLines = [];
  let inPBXFrameworksBuildPhase = false;
  let inFrameworksSection = false;
  let frameworksBraceDepth = 0;
  let currentFrameworksBuildPhaseId = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're starting the PBXFrameworksBuildPhase section
    if (line.includes('/* Begin PBXFrameworksBuildPhase section */')) {
      inPBXFrameworksBuildPhase = true;
      processedLines.push(line);
      continue;
    }

    // Check if we're ending the PBXFrameworksBuildPhase section
    if (line.includes('/* End PBXFrameworksBuildPhase section */')) {
      inPBXFrameworksBuildPhase = false;
      processedLines.push(line);
      continue;
    }

    // If we're in the PBXFrameworksBuildPhase section
    if (inPBXFrameworksBuildPhase) {
      // Look for framework build phase pattern: "objectId /* Frameworks */ = {"
      const frameworksMatch = line.match(
        /^\s*([A-F0-9]+)\s*\/\*\s*Frameworks\s*\*\/\s*=\s*\{/,
      );
      if (frameworksMatch) {
        inFrameworksSection = true;
        frameworksBraceDepth = 1;
        currentFrameworksBuildPhaseId = frameworksMatch[1];
        processedLines.push(line);
        continue;
      }

      // If we're in a frameworks section
      if (inFrameworksSection) {
        // Track brace depth to know when the frameworks section ends
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        frameworksBraceDepth += openBraces - closeBraces;

        // Check if we found "files = ("
        if (line.includes('files = (')) {
          processedLines.push(line);

          // Generate new files content

          const frameworksBuildPhase = // $FlowFixMe[incompatible-type]
            xcodeProjectJSON.objects[currentFrameworksBuildPhaseId];
          if (frameworksBuildPhase && frameworksBuildPhase.files) {
            for (const fileId of frameworksBuildPhase.files) {
              const buildFileObject = xcodeProjectJSON.objects[fileId];
              if (buildFileObject) {
                processedLines.push(
                  printFilesForBuildPhase(
                    fileId,
                    buildFileObject,
                    xcodeProjectJSON.objects,
                  ),
                );
              }
            }
          }

          // Skip lines until we find the closing ");"
          i++;
          while (i < lines.length && !lines[i].includes(');')) {
            i++;
          }
          // Add the closing ");" line
          if (i < lines.length) {
            processedLines.push(lines[i]);
          }
          continue;
        }

        // If we're at the end of the frameworks section
        if (frameworksBraceDepth === 0) {
          inFrameworksSection = false;
          currentFrameworksBuildPhaseId = null;
        }

        processedLines.push(line);
        continue;
      }
    }

    // Default: just add the line as-is
    processedLines.push(line);
  }

  return processedLines.join('\n');
}

module.exports = {
  addLocalSwiftPM,
  addMissingSections,
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
  printPBXBuildFile,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency,
  updatePBXFrameworksBuildPhaseFiles,
};
