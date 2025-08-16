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
 * Convert JSON project back to text format for project.pbxproj
 * @param {Object} xcodeProject - The xcode project JSON object
 * @returns {string} Text representation of the project.pbxproj file
 */
function convertJSONProjectToText(xcodeProject) {
  const objects = xcodeProject.objects;
  let output = '// !$*UTF8*$!\n{\n';

  // Add top-level properties
  output += `\tarchiveVersion = ${xcodeProject.archiveVersion};\n`;
  output += '\tclasses = {\n\t};\n';
  output += `\tobjectVersion = ${xcodeProject.objectVersion};\n`;
  output += '\tobjects = {\n\n';

  // Group objects by type in a single pass
  const objectsByType = new Map();
  for (const [objectId, objectData] of Object.entries(objects)) {
    const objectType = objectData.isa;
    if (!objectsByType.has(objectType)) {
      objectsByType.set(objectType, []);
    }
    objectsByType.get(objectType).push([objectId, objectData]);
  }

  // Define the order of object types
  const objectTypes = [
    'PBXBuildFile',
    'PBXContainerItemProxy',
    'PBXFileReference',
    'PBXFrameworksBuildPhase',
    'PBXGroup',
    'PBXNativeTarget',
    'PBXProject',
    'PBXResourcesBuildPhase',
    'PBXShellScriptBuildPhase',
    'PBXSourcesBuildPhase',
    'PBXTargetDependency',
    'XCBuildConfiguration',
    'XCConfigurationList',
    'XCLocalSwiftPackageReference',
    'XCSwiftPackageProductDependency'
  ];

  // Output objects in the defined order
  for (const objectType of objectTypes) {
    const objectsOfType = objectsByType.get(objectType);

    if (objectsOfType && objectsOfType.length > 0) {
      // Sort objects by their ID
      objectsOfType.sort((a, b) => a[0].localeCompare(b[0]));

      output += `/* Begin ${objectType} section */\n`;

      for (const [objectId, objectData] of objectsOfType) {
        const comment = getObjectComment(objectData, objects);
        const singleLineTypes = ['PBXBuildFile', 'PBXFileReference'];
        const isSingleLine = singleLineTypes.includes(objectData.isa);

        if (isSingleLine) {
          const properties = formatObjectProperties(objectData, objects, '\t\t\t');
          output += `\t\t${objectId}${comment} = {${properties}};\n`;
        } else {
          output += `\t\t${objectId}${comment} = {\n`;
          output += formatObjectProperties(objectData, objects, '\t\t\t');
          output += '\t\t};\n';
        }
      }

      output += `/* End ${objectType} section */\n\n`;
    }
  }

  // Handle any remaining object types that weren't in our predefined list
  for (const [objectType, objectsOfType] of objectsByType) {
    if (!objectTypes.includes(objectType)) {
      // Sort objects by their ID
      objectsOfType.sort((a, b) => a[0].localeCompare(b[0]));

      output += `/* Begin ${objectType} section */\n`;

      for (const [objectId, objectData] of objectsOfType) {
        const comment = getObjectComment(objectData, objects);
        const singleLineTypes = ['PBXBuildFile', 'PBXFileReference'];
        const isSingleLine = singleLineTypes.includes(objectData.isa);

        if (isSingleLine) {
          const properties = formatObjectProperties(objectData, objects, '\t\t\t');
          output += `\t\t${objectId}${comment} = {${properties.trim()}};\n`;
        } else {
          output += `\t\t${objectId}${comment} = {\n`;
          output += formatObjectProperties(objectData, objects, '\t\t\t');
          output += '\t\t};\n';
        }
      }

      output += `/* End ${objectType} section */\n\n`;
    }
  }

  output += '\t};\n';
  output += `\trootObject = ${xcodeProject.rootObject} /* Project object */;\n`;
  output += '}\n';

  return output;
}

/**
 * Get comment for an object based on its properties
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Comment string
 */
function getObjectComment(objectData, allObjects) {
  if (objectData.name) {
    return ` /* ${objectData.name} */`;
  }
  if (objectData.path) {
    return ` /* ${objectData.path} */`;
  }
  if (objectData.productName) {
    return ` /* ${objectData.productName} */`;
  }
  if (objectData.fileRef && allObjects[objectData.fileRef]) {
    const referencedFile = allObjects[objectData.fileRef];
    if (referencedFile.name) {
      return ` /* ${referencedFile.name} in ${getActionName(objectData, allObjects)} */`;
    }
    if (referencedFile.path) {
      return ` /* ${referencedFile.path} in ${getActionName(objectData, allObjects)} */`;
    }
  }
  if (objectData.isa === 'PBXProject') {
    return ' /* Project object */';
  }
  return '';
}

/**
 * Get action name for build file objects
 * @param {Object} objectData - The PBXBuildFile object
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Action name (Sources, Resources, Frameworks, etc.)
 */
function getActionName(objectData, allObjects) {
  if (objectData.isa !== 'PBXBuildFile') {
    return '';
  }

  // If it has a productRef, it's likely a framework/library dependency
  if (objectData.productRef) {
    return 'Frameworks';
  }

  // Look at the file reference to determine the type
  if (objectData.fileRef && allObjects[objectData.fileRef]) {
    const referencedFile = allObjects[objectData.fileRef];
    const fileName = referencedFile.path || referencedFile.name || '';

    // Check file extension to guess the build phase
    if (fileName.match(/\.(m|mm|c|cpp|cc|cxx|swift)$/)) {
      return 'Sources';
    }
    if (fileName.match(/\.(png|jpg|jpeg|gif|xib|storyboard|plist|strings|json|bundle)$/)) {
      return 'Resources';
    }
    if (fileName.match(/\.(framework|dylib|a|tbd)$/)) {
      return 'Frameworks';
    }
  }

  // Default fallback
  return 'Sources';
}

/**
 * Format object properties recursively
 * @param {Object} objectData - The object to format
 * @param {Object} allObjects - All objects for reference lookup
 * @param {string} indent - Current indentation
 * @returns {string} Formatted properties string
 */
function formatObjectProperties(objectData, allObjects, indent) {
  // Check if this object type should be formatted on a single line
  const singleLineTypes = ['PBXBuildFile', 'PBXFileReference'];
  const isSingleLine = singleLineTypes.includes(objectData.isa);

  // Sort keys to have isa first
  const sortedKeys = sortKeys(objectData);

  if (isSingleLine) {
    // Format all properties on a single line
    const properties = [];
    for (const key of sortedKeys) {
      const value = objectData[key];
      properties.push(`${key} = ${formatValue(value, allObjects, indent, true)}`);
    }
    return properties.join('; ') + '; ';
  } else {
    // Format with indentation and newlines
    let output = '';
    for (const key of sortedKeys) {
      const value = objectData[key];
      output += `${indent}${key} = ${formatValue(value, allObjects, indent)};\n`;
    }
    return output;
  }
}

/**
 * Format a value based on its type
 * @param {*} value - The value to format
 * @param {Object} allObjects - All objects for reference lookup
 * @param {string} indent - Current indentation
 * @param {boolean} singleLine - Whether to format on a single line
 * @returns {string} Formatted value string
 */
function formatValue(value, allObjects, indent, singleLine = false) {
  if (typeof value === 'string') {
    // Check if this looks like an object ID reference
    if (allObjects && allObjects[value]) {
      const referencedObj = allObjects[value];
      let comment = '';
      if (referencedObj.name) {
        comment = ` /* ${referencedObj.name} */`;
      } else if (referencedObj.path) {
        comment = ` /* ${referencedObj.path} */`;
      } else if (referencedObj.isa === 'PBXProject') {
        comment = ' /* Project object */';
      }
      return `${value}${comment}`;
    }

    // Quote strings that need quoting
    if (needsQuoting(value)) {
      return `"${value}"`;
    }
    return value;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '()';
    }

    if (singleLine) {
      // Format array on a single line
      const items = value.map(item => formatValue(item, allObjects, indent, true));
      return `(${items.join(', ')})`;
    } else {
      // Format array with indentation and newlines
      let arrayOutput = '(\n';
      for (const item of value) {
        arrayOutput += `${indent}\t${formatValue(item, allObjects, indent + '\t')},\n`;
      }
      arrayOutput += `${indent})`;
      return arrayOutput;
    }
  }

  if (typeof value === 'object' && value !== null) {
    if (singleLine) {
      // Format object on a single line
      const properties = [];
      for (const [key, val] of Object.entries(value)) {
        properties.push(`${key} = ${formatValue(val, allObjects, indent, true)}`);
      }
      return `{${properties.join('; ')}}`;
    } else {
      // Format object with indentation and newlines
      let objOutput = '{\n';
      for (const [key, val] of Object.entries(value)) {
        objOutput += `${indent}\t${key} = ${formatValue(val, allObjects, indent + '\t')};\n`;
      }
      objOutput += `${indent}}`;
      return objOutput;
    }
  }

  return String(value);
}

/**
 * Sort object keys with 'isa' first, then alphabetically
 * @param {Object} objectData - The object to get sorted keys for
 * @returns {Array<string>} Sorted array of keys
 */
function sortKeys(objectData) {
  return Object.keys(objectData).sort((a, b) => {
    if (a === 'isa') return -1;
    if (b === 'isa') return 1;
    return a.localeCompare(b);
  });
}

/**
 * Check if a string needs to be quoted
 * @param {string} str - The string to check
 * @returns {boolean} Whether the string needs quoting
 */
function needsQuoting(str) {
  // Don't quote pure numbers (even if they're strings)
  if (/^\d+$/.test(str)) {
    return false;
  }

  // Don't quote Xcode object IDs (24-character hex strings)
  if (/^[A-F0-9]{24}$/.test(str)) {
    return false;
  }

  // Don't quote simple identifiers (letters, numbers, underscores only)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)) {
    return false;
  }

  // Quote everything else (contains spaces, special characters, paths, etc.)
  return true;
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
    if (object.isa !== "PBXNativeTarget") continue;

    // Find PBXFrameworksBuildPhase
    for (const buildPhaseId of object.buildPhases || []) {
      const buildPhaseObject = objects[buildPhaseId];
      if (!buildPhaseObject || buildPhaseObject.isa !== "PBXFrameworksBuildPhase") continue;

      const filesToRemove = [];

      // Check each file in the build phase
      for (const fileId of buildPhaseObject.files || []) {
        const buildFileObject = objects[fileId];
        if (!buildFileObject || buildFileObject.isa !== "PBXBuildFile" || !buildFileObject.productRef) continue;

        const productRefObject = objects[buildFileObject.productRef];
        if (!productRefObject || productRefObject.isa !== "XCSwiftPackageProductDependency") continue;

        // Mark for removal: the product dependency, the build file, and remove from files list
        objectsToRemove.push(buildFileObject.productRef);
        objectsToRemove.push(fileId);
        filesToRemove.push(fileId);
      }

      // Remove files from the build phase
      if (filesToRemove.length > 0) {
        buildPhaseObject.files = (buildPhaseObject.files || []).filter(fileId => !filesToRemove.includes(fileId));
      }
    }
  }

  // Step 2: Find PBXProject and clean up packageReferences
  for (const objectId in objects) {
    const object = objects[objectId];
    if (object.isa !== "PBXProject") continue;

    const packageReferencesToRemove = [];

    // Check each package reference
    for (const packageRefId of object.packageReferences || []) {
      const packageRefObject = objects[packageRefId];
      if (!packageRefObject || packageRefObject.isa !== "XCLocalSwiftPackageReference") continue;

      // Mark for removal
      objectsToRemove.push(packageRefId);
      packageReferencesToRemove.push(packageRefId);
    }

    // Remove package references from the project
    if (packageReferencesToRemove.length > 0) {
      object.packageReferences = (object.packageReferences || []).filter(refId => !packageReferencesToRemove.includes(refId));
    }

    break;
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
    if (object.isa !== "PBXProject") continue;

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
      if (object.isa !== "PBXNativeTarget" || object.name !== targetName) continue;

      // Iterate over buildPhases to find PBXFrameworksBuildPhase
      for (const buildPhaseId of object.buildPhases) {
        const buildPhaseObject = objects[buildPhaseId];
        if (!buildPhaseObject || buildPhaseObject.isa !== "PBXFrameworksBuildPhase") continue;

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

// Stub functions for printing specific PBX object types
// These will be implemented later for custom formatting of each type

/**
 * Print PBXBuildFile object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXBuildFile(objectId, objectData, allObjects) {
  // Get the referenced file
  const referencedFile = allObjects[objectData.fileRef];
  const filename = referencedFile ? (referencedFile.name || referencedFile.path || 'Unknown') : 'Unknown';

  // Determine the type by searching build phases
  let type = 'Unknown';
  for (const [phaseId, phaseObject] of Object.entries(allObjects)) {
    if (phaseObject.files && phaseObject.files.includes(objectId)) {
      switch (phaseObject.isa) {
        case 'PBXSourcesBuildPhase':
          type = 'Sources';
          break;
        case 'PBXResourcesBuildPhase':
          type = 'Resources';
          break;
        case 'PBXFrameworksBuildPhase':
          type = 'Frameworks';
          break;
        case 'PBXShellScriptBuildPhase':
          type = 'ShellScript';
          break;
      }
      break;
    }
  }

  // Format the output as a single line
  return `\t\t${objectId} /* ${filename} in ${type} */ = {isa = PBXBuildFile; fileRef = ${objectData.fileRef} /* ${filename} */; };\n`;
}

/**
 * Print PBXContainerItemProxy object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXContainerItemProxy(objectId, objectData, allObjects) {
  let output = `\t\t${objectId} /* PBXContainerItemProxy */ = {\n`;

  // Sort keys with isa first
  const sortedKeys = sortKeys(objectData);

  // Iterate over sorted keys
  for (const key of sortedKeys) {
    const value = objectData[key];
    let comment = '';

    // Special case for containerPortal
    if (key === 'containerPortal') {
      comment = ' /* Project object */';
    }

    output += `\t\t\t${key} = ${value}${comment};\n`;
  }

  output += `\t\t};\n`;
  return output;
}

/**
 * Print PBXFileReference object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXFileReference(objectId, objectData, allObjects) {
  // Get comment based on name or path
  const comment = objectData.name ? ` /* ${objectData.name} */` :
                 objectData.path ? ` /* ${objectData.path} */` : '';

  // Sort keys with isa first
  const sortedKeys = sortKeys(objectData);

  // Format all properties on a single line
  const properties = [];
  for (const key of sortedKeys) {
    let value = objectData[key];

    // Special case for sourceTree - escape with quotes if value is "<group>"
    if (key === 'sourceTree' && value === '<group>') {
      value = `"${value}"`;
    }

    properties.push(`${key} = ${value}`);
  }

  return `\t\t${objectId}${comment} = { ${properties.join('; ')}; };\n`;
}

/**
 * Print PBXFrameworksBuildPhase object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXFrameworksBuildPhase(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXFrameworksBuildPhase
  return '';
}

/**
 * Print PBXGroup object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXGroup(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXGroup
  return '';
}

/**
 * Print PBXNativeTarget object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXNativeTarget(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXNativeTarget
  return '';
}

/**
 * Print PBXProject object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXProject(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXProject
  return '';
}

/**
 * Print PBXResourcesBuildPhase object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXResourcesBuildPhase(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXResourcesBuildPhase
  return '';
}

/**
 * Print PBXShellScriptBuildPhase object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXShellScriptBuildPhase(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXShellScriptBuildPhase
  return '';
}

/**
 * Print PBXSourcesBuildPhase object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXSourcesBuildPhase(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXSourcesBuildPhase
  return '';
}

/**
 * Print PBXTargetDependency object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printPBXTargetDependency(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for PBXTargetDependency
  return '';
}

/**
 * Print XCBuildConfiguration object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printXCBuildConfiguration(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for XCBuildConfiguration
  return '';
}

/**
 * Print XCConfigurationList object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printXCConfigurationList(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for XCConfigurationList
  return '';
}

/**
 * Print XCLocalSwiftPackageReference object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printXCLocalSwiftPackageReference(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for XCLocalSwiftPackageReference
  return '';
}

/**
 * Print XCSwiftPackageProductDependency object
 * @param {string} objectId - The object ID
 * @param {Object} objectData - The object data
 * @param {Object} allObjects - All objects for reference lookup
 * @returns {string} Formatted string for this object type
 */
function printXCSwiftPackageProductDependency(objectId, objectData, allObjects) {
  // TODO: Implement custom formatting for XCSwiftPackageProductDependency
  return '';
}

module.exports = {
  generateXcodeObjectId,
  convertXcodeProjectToJSON,
  convertJSONProjectToText,
  deintegrateSwiftPM,
  addLocalSwiftPM,
  printPBXBuildFile,
  printPBXContainerItemProxy,
  printPBXFileReference,
  printPBXFrameworksBuildPhase,
  printPBXGroup,
  printPBXNativeTarget,
  printPBXProject,
  printPBXResourcesBuildPhase,
  printPBXShellScriptBuildPhase,
  printPBXSourcesBuildPhase,
  printPBXTargetDependency,
  printXCBuildConfiguration,
  printXCConfigurationList,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency
};
