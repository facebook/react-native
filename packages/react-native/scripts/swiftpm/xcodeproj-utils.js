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
  addMissingSections,
  generateXcodeObjectId,
  printFilesForBuildPhase,
  printPBXBuildFile,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency,
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
 * Update the project.pbxproj file with the sections that needs to be rewritten
 * @param {string} textualProject - The textual representation of the Xcode project
 * @param {Object} xcodeProjectJSON - The JSON representation of the Xcode project
 * @returns {string} Updated textual project the sections that needs to be rewritten.
 */
function updateProjectFile(
  textualProject /*: string */,
  xcodeProjectJSON /*: XcodeProject */,
  objectsByIsa /*: {[string]: {[string]: XcodeObject}} */,
) /*: string */ {
  let workingProject = textualProject;

  const sectionsToRewrite /*: {[string]: (objectId: string, objectData: XcodeObject, allObjects: {[string]: XcodeObject}) => string} */ =
    {
      PBXBuildFile: printPBXBuildFile,
      XCLocalSwiftPackageReference: printXCLocalSwiftPackageReference,
      XCSwiftPackageProductDependency: printXCSwiftPackageProductDependency,
    };

  // Track which sections exist and which need to be added
  const sectionsToAdd = [];

  // Iterate over the sectionsToRewrite and update each section
  for (const [sectionType, printFn] of Object.entries(sectionsToRewrite)) {
    // Extract objects that correspond to this type
    const objectsOfType = objectsByIsa[sectionType] || {};

    // Sort the objectsOfType by their objectId (keys) alphabetically
    const sortedObjectIds = Object.keys(objectsOfType).sort();

    // Create replacement text using the appropriate print function
    let replacementText = '';
    for (const objectId of sortedObjectIds) {
      const objectData = objectsOfType[objectId];
      replacementText += printFn(
        objectId,
        objectData,
        xcodeProjectJSON.objects,
      );
    }

    // Search for the section in workingProject and replace it
    const sectionStartPattern = new RegExp(
      `/\\* Begin ${sectionType} section \\*/`,
    );
    const sectionEndPattern = new RegExp(
      `/\\* End ${sectionType} section \\*/`,
    );

    const startMatch = workingProject.match(sectionStartPattern);
    const endMatch = workingProject.match(sectionEndPattern);

    if (startMatch && endMatch) {
      const startIndex = startMatch.index + startMatch[0].length;
      const endIndex = endMatch.index;

      // Replace the content between the section markers
      const beforeSection = workingProject.substring(0, startIndex);
      const afterSection = workingProject.substring(endIndex);

      workingProject = beforeSection + '\n' + replacementText + afterSection;
    } else if (Object.keys(objectsOfType).length > 0) {
      // Section doesn't exist but we have objects to add
      sectionsToAdd.push({
        sectionType,
        replacementText: `/* Begin ${sectionType} section */\n${replacementText}/* End ${sectionType} section */\n`,
      });
    }
  }

  // Add missing sections in the correct order if needed
  if (sectionsToAdd.length > 0) {
    workingProject = addMissingSections(workingProject, sectionsToAdd);
  }

  return workingProject;
}

function updatePackageReferenceSection(
  textualProject /*: string */,
  xcodeProjectJSON /*: XcodeProject */,
  objectsByIsa /*: {[string]: {[string]: XcodeObject}} */,
) /*: string */ {
  const lines = textualProject.split('\n');
  const processedLines = [];
  let inPBXProjectSection = false;
  let inProjectObject = false;
  let projectBraceDepth = 0;
  let currentProjectObjectId = null;
  let packageReferencesInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're starting the PBXProject section
    if (line.includes('/* Begin PBXProject section */')) {
      inPBXProjectSection = true;
      processedLines.push(line);
      continue;
    }

    // Check if we're ending the PBXProject section
    if (line.includes('/* End PBXProject section */')) {
      inPBXProjectSection = false;
      processedLines.push(line);
      continue;
    }

    // If we're in the PBXProject section
    if (inPBXProjectSection) {
      // Look for project object pattern: "objectId /* Project object */ = {"
      const projectMatch = line.match(
        /^\s*([A-F0-9]+)\s*\/\*\s*Project object\s*\*\/\s*=\s*\{/,
      );
      if (projectMatch) {
        inProjectObject = true;
        projectBraceDepth = 1;
        currentProjectObjectId = projectMatch[1];
        packageReferencesInserted = false; // Reset flag for each project object
        processedLines.push(line);
        continue;
      }

      // If we're in a project object
      if (inProjectObject) {
        // Track brace depth to know when the project section ends
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        projectBraceDepth += openBraces - closeBraces;

        // Check if we found "packageReferences = ("
        if (line.includes('packageReferences = (')) {
          packageReferencesInserted = true; // Mark as already present
          processedLines.push(line);

          // Generate new packageReferences content
          const projectObject = // $FlowFixMe[incompatible-type]
            xcodeProjectJSON.objects[currentProjectObjectId];
          if (projectObject && projectObject.packageReferences) {
            for (const packageRefId of projectObject.packageReferences) {
              const packageRefObject = xcodeProjectJSON.objects[packageRefId];
              if (
                packageRefObject &&
                packageRefObject.isa === 'XCLocalSwiftPackageReference'
              ) {
                processedLines.push(
                  `\t\t\t\t${packageRefId} /* XCLocalSwiftPackageReference "${packageRefObject.relativePath}" */,`,
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

        // Check if we need to insert packageReferences property
        if (
          projectBraceDepth === 1 &&
          !packageReferencesInserted &&
          !line.includes('packageReferences') &&
          line.trim().endsWith(';')
        ) {
          // Check if this is a property line we should insert packageReferences before
          // Insert packageReferences in alphabetical order (after 'mainGroup' but before 'projectDirPath')
          const propertyMatch = line.match(/^\s*(\w+)\s*=/);
          if (propertyMatch) {
            const propertyName = propertyMatch[1];

            // Insert packageReferences before properties that come after 'p' alphabetically
            if (propertyName > 'packageReferences') {
              const projectObject = // $FlowFixMe[incompatible-type]
                xcodeProjectJSON.objects[currentProjectObjectId];
              if (
                projectObject &&
                projectObject.packageReferences &&
                projectObject.packageReferences.length > 0
              ) {
                processedLines.push('\t\t\tpackageReferences = (');
                for (const packageRefId of projectObject.packageReferences) {
                  const packageRefObject =
                    xcodeProjectJSON.objects[packageRefId];
                  if (
                    packageRefObject &&
                    packageRefObject.isa === 'XCLocalSwiftPackageReference'
                  ) {
                    processedLines.push(
                      `\t\t\t\t${packageRefId} /* XCLocalSwiftPackageReference "${packageRefObject.relativePath}" */,`,
                    );
                  }
                }
                processedLines.push('\t\t\t);');
                packageReferencesInserted = true; // Mark as inserted
              }
            }
          }
        }

        // If we're at the end of the project section
        if (projectBraceDepth === 0) {
          inProjectObject = false;
          currentProjectObjectId = null;
          packageReferencesInserted = false;
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
  updatePBXFrameworksBuildPhaseFiles,
  updatePackageReferenceSection,
  updateProjectFile,
};
