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
 * Script to create symlinks for header files in React/includes/React
 *
 * This script:
 * 1. Scans the React and Libraries directories to build a map of header files
 * 2. Iterates over an array of headers
 * 3. Looks up each header in the map and creates a symlink in React/includes/React
 */

// Import the headers array from headers.js
const {HEADERS} = require('./headers');
const fs = require('fs');
const path = require('path');

/**
 * Function to recursively scan directories and build a map of header files
 * @param {string} directory - Directory to scan for header files
 * @returns {Map<string, string>} Map of filename to full path
 */
function buildHeaderMap(directory) {
  const headerMap = new Map();

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, {withFileTypes: true});

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.h')) {
        // Store by filename only, without any subpath
        headerMap.set(entry.name, fullPath);
      }
    }
  }

  scanDirectory(directory);
  return headerMap;
}

/**
 * Creates symlinks for header files in React/includes/React
 * @param {string} reactNativePath - Path to the React Native package directory
 * @returns {Promise<{found: number, notFound: number, errors: number}>} Statistics about the operation
 */
async function createSymlinks(reactNativePath) {
  console.log(`Creating symlinks for React Native at: ${reactNativePath}`);

  // Define paths based on the provided reactNativePath
  const REACT_DIR = path.join(reactNativePath, 'React');
  const LIBRARIES_DIR = path.join(reactNativePath, 'Libraries');
  const DESTINATION_DIR = path.join(reactNativePath, 'React/includes/React');

  // Validate that the directories exist
  if (!fs.existsSync(REACT_DIR)) {
    throw new Error(`React directory not found: ${REACT_DIR}`);
  }

  if (!fs.existsSync(LIBRARIES_DIR)) {
    throw new Error(`Libraries directory not found: ${LIBRARIES_DIR}`);
  }

  // Ensure destination directory exists
  if (!fs.existsSync(DESTINATION_DIR)) {
    console.log(`Creating directory: ${DESTINATION_DIR}`);
    fs.mkdirSync(DESTINATION_DIR, {recursive: true});
  }

  console.log('Building header file map...');

  // Build a map of all header files in React and Libraries directories
  const reactHeaderMap = buildHeaderMap(REACT_DIR);
  const librariesHeaderMap = buildHeaderMap(LIBRARIES_DIR);

  // Merge the two maps, with React headers taking precedence
  const headerMap = new Map([...librariesHeaderMap, ...reactHeaderMap]);

  console.log(`Found ${headerMap.size} unique header files`);

  // Counter for statistics
  let found = 0;
  let notFound = 0;
  let errors = 0;

  // Arrays to collect headers that couldn't be found or had errors
  const notFoundHeaders = [];
  const errorHeaders = [];

  // Process each header
  HEADERS.forEach(header => {
    try {
      // Extract just the filename for both search and target
      let targetFilename = header;

      // Handle headers with path components
      if (header.includes('/')) {
        const parts = header.split('/');
        targetFilename = parts[parts.length - 1];
      }

      // Look up the header in our map using just the filename
      const sourcePath = headerMap.get(targetFilename);

      if (sourcePath) {
        const destPath = path.join(DESTINATION_DIR, targetFilename);

        // Create symlink
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }

        // Create relative symlink
        const relativeSourcePath = path.relative(DESTINATION_DIR, sourcePath);
        fs.symlinkSync(relativeSourcePath, destPath);

        console.log(
          `Created symlink: ${targetFilename} -> ${relativeSourcePath}`,
        );
        found++;
      } else {
        console.warn(
          `Warning: Could not find header file: ${header} (filename: ${targetFilename})`,
        );
        notFoundHeaders.push({header, targetFilename});
        notFound++;
      }
    } catch (error) {
      console.error(`Error processing ${header}: ${error.message}`);
      errorHeaders.push({header, error: error.message});
      errors++;
    }
  });

  console.log('\nSummary:');
  console.log(`- Found and linked: ${found} files`);
  console.log(`- Not found: ${notFound} files`);
  console.log(`- Errors: ${errors} files`);

  if (notFound > 0) {
    console.log('\nHeaders that could not be found:');
    notFoundHeaders.forEach(({header, targetFilename}) => {
      console.log(`  - ${header} (filename: ${targetFilename})`);
    });
  }

  if (errors > 0) {
    console.log('\nHeaders that had errors:');
    errorHeaders.forEach(({header, error}) => {
      console.log(`  - ${header}: ${error}`);
    });
  }

  if (notFound > 0 || errors > 0) {
    const message = 'Some headers could not be found or had errors.';
    console.log(`\n${message}`);
    throw new Error(message);
  } else {
    console.log('\nAll headers were successfully linked.');
  }

  return {found, notFound, errors};
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  let reactNativePath;

  if (args.length >= 1) {
    reactNativePath = path.resolve(args[0]);
  } else {
    // Default to the current package directory structure for backward compatibility
    reactNativePath = path.resolve(__dirname, '..');
  }

  console.log('Usage: node create-symlinks.js [reactNativePath]');
  console.log(`Using React Native path: ${reactNativePath}`);

  createSymlinks(reactNativePath)
    .then((stats) => {
      console.log('\n✅ Symlink creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Symlink creation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  createSymlinks,
  buildHeaderMap
};
