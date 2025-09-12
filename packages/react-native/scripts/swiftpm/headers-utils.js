/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {listHeadersInFolder, setupSymlink} = require('./utils');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to create symlinks from a source path
 * @param {string} sourcePath - Source directory to search for headers
 * @param {string} outputPath - Default output directory for symlinks
 * @param {boolean} preserveStructure - Whether to preserve directory structure
 * @param {Array<string>} excludeFolders - Folder names to exclude
 * @param {Object} customMappings - Custom path mappings (prefix -> output path)
 * @returns {number} Number of symlinks created
 */
function symlinkHeadersFromPath(
  sourcePath /*: string */,
  outputPath /*: string */,
  preserveStructure /*: boolean */,
  excludeFolders /*: Array<string> */,
  customMappings /*: {[string]: string} */ = {},
) /*: number */ {
  let linkedCount = 0;

  try {
    // Build find command with exclusions using -prune
    const headerFiles = listHeadersInFolder(sourcePath, excludeFolders);
    headerFiles.forEach(sourceHeaderPath => {
      if (fs.existsSync(sourceHeaderPath)) {
        const relativePath = path.relative(sourcePath, sourceHeaderPath);
        let destPath = '';
        let mappedOutputPath = outputPath;

        // Check for custom mappings first
        for (const [prefix, customOutput] of Object.entries(customMappings)) {
          if (relativePath.startsWith(prefix)) {
            mappedOutputPath = customOutput;
            console.log(`  Custom mapping: ${prefix} -> ${customOutput}`);
            break;
          }
        }

        if (preserveStructure) {
          // Preserve directory structure
          destPath = path.join(mappedOutputPath, relativePath);
        } else {
          // Flatten structure - just use the header filename
          const headerName = path.basename(sourceHeaderPath);
          destPath = path.join(mappedOutputPath, headerName);
        }

        // Create destination directory if it doesn't exist
        setupSymlink(sourceHeaderPath, destPath);
        linkedCount++;
      }
    });
  } catch (error) {
    console.warn(
      `Failed to process headers from ${sourcePath}:`,
      error.message,
    );
  }

  return linkedCount;
}

/**
 * Create symlinks for ReactApple headers with special path logic.
 * ReactApple has a custom structure, which is:
 *
 * ReactApple
 * ├── Libraries
 * │   └── RCTFoundation
 * │       ├── RCTDeprecation
 * │       │   ├── BUCK
 * │       │   ├── Exported
 * │       │   │   └── RCTDeprecation.h
 * │       │   ├── RCTDeprecation.m
 * │       │   ├── RCTDeprecation.podspec
 * │       │   └── README.md
 * │       └── README.md
 * └── README.md
 *
 * We need to create symlinks for the headers in the "Exported" folder to
 * the headersOutput/<parent-of-Exported> folder.
 * @param {string} reactApplePath - Path to ReactApple directory
 * @param {string} headersOutput - Base headers output directory
 * @returns {number} Number of symlinks created
 */
function symlinkReactAppleHeaders(
  reactApplePath /*: string */,
  headersOutput /*: string */,
) /*: number */ {
  let linkedCount = 0;

  const mappings /*: {[string]: string } */ = {};
  mappings[
    `${reactApplePath}/Libraries/RCTFoundation/RCTDeprecation/Exported`
  ] = `${headersOutput}/RCTDeprecation`;

  // Iterate over the key-value pairs of the mappings object
  for (const [sourceDir, destDir] of Object.entries(mappings)) {
    const headerFiles = listHeadersInFolder(sourceDir, ['tests']);
    headerFiles.forEach(sourceHeaderPath => {
      const destFilePath = path.join(destDir, path.basename(sourceHeaderPath));
      setupSymlink(sourceHeaderPath, destFilePath);
      linkedCount++;
    });
  }

  return linkedCount;
}

module.exports = {
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
};
