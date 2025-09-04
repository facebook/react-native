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
const fs = require('fs');
const path = require('path');

/*::
type RequiredHeaders = 'react-native' | 'codegen' | 'third-party-dependencies' | 'all';
*/

/**
 * Prepares app dependencies headers for SwiftPM integration
 * @param {string} reactNativePath - Path to the React Native directory
 * @param {string} iosAppPath - Path to the iOS app directory
 * @param {string} outputFolder - Path to the output folder where headers will be hard linked
 * @param {string} requiredHeaders - Type of headers to include: 'react-native', 'codegen', 'third-party-dependencies', or 'all'
 */
function prepareAppDependenciesHeaders(
  reactNativePath /*: string */,
  iosAppPath /*: string */,
  outputFolder /*: string */,
  requiredHeaders /*: RequiredHeaders */,
) /*: void */ {
  // Validate parameters
  if (!reactNativePath || !iosAppPath || !outputFolder || !requiredHeaders) {
    throw new Error(
      'Missing required parameters. Usage: prepareAppDependenciesHeaders(reactNativePath, iosAppPath, outputFolder, requiredHeaders)',
    );
  }

  if (
    !['react-native', 'codegen', 'third-party-dependencies', 'all'].includes(
      requiredHeaders,
    )
  ) {
    throw new Error(
      "requiredHeaders must be one of: 'react-native', 'codegen', 'third-party-dependencies', 'all'",
    );
  }

  // Validate paths exist
  if (!fs.existsSync(reactNativePath)) {
    throw new Error(`React Native path does not exist: ${reactNativePath}`);
  }

  if (!fs.existsSync(iosAppPath)) {
    throw new Error(`iOS app path does not exist: ${iosAppPath}`);
  }

  // Create output folder if it doesn't exist
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true});
    console.log(`Created output folder: ${outputFolder}`);
  }

  console.log('Preparing app dependencies headers...');
  console.log(`React Native path: ${reactNativePath}`);
  console.log(`iOS app path: ${iosAppPath}`);
  console.log(`Output folder: ${outputFolder}`);
  console.log(`Required headers: ${requiredHeaders}`);

  try {
    switch (requiredHeaders) {
      case 'react-native':
        hardlinkReactNativeHeaders(reactNativePath, outputFolder);
        break;
      case 'codegen':
        hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);
        break;
      case 'third-party-dependencies':
        hardlinkThirdPartyDependenciesHeaders(reactNativePath, outputFolder);
        break;
      case 'all':
        hardlinkReactNativeHeaders(reactNativePath, outputFolder);
        hardlinkCodegenHeaders(reactNativePath, iosAppPath, outputFolder);
        hardlinkThirdPartyDependenciesHeaders(reactNativePath, outputFolder);
        break;
      default:
        throw new Error(
          `Unsupported requiredHeaders value: ${requiredHeaders}`,
        );
    }

    console.log('Successfully prepared app dependencies headers');
  } catch (error) {
    console.error('Error preparing app dependencies headers:', error.message);
    throw error;
  }
}

/**
 * Create hard links for React Native headers in the output folder
 * @param {string} reactNativePath - Path to the React Native directory
 * @param {string} outputFolder - Path to the output folder
 * @param {string} folderName - Name of the folder where headers will be created (default: 'headers')
 */
function hardlinkReactNativeHeaders(
  reactNativePath /*: string */,
  outputFolder /*: string */,
  folderName /*: string */ = 'headers',
) /*: void */ {
  console.log('Creating hard links for React Native headers...');

  const headersOutput = path.join(outputFolder, folderName);
  if (!fs.existsSync(headersOutput)) {
    fs.mkdirSync(headersOutput, {recursive: true});
  }

  let totalLinkedCount = 0;

  // Create React subdirectory for React and Libraries headers
  const reactHeadersOutput = path.join(headersOutput, 'React');
  if (!fs.existsSync(reactHeadersOutput)) {
    fs.mkdirSync(reactHeadersOutput, {recursive: true});
  }

  // Define custom mappings for Libraries folder
  const reactMappings = {
    'FBReactNativeSpec/': path.join(headersOutput, 'FBReactNativeSpec'),
  };

  // 1. Process React folder - flatten structure, exclude 'includes', 'headers', and 'tests' folders
  const reactPath = path.join(reactNativePath, 'React');
  if (fs.existsSync(reactPath)) {
    console.log('Processing React folder...');
    const reactCount = hardlinkHeadersFromPath(
      reactPath,
      reactHeadersOutput,
      false,
      ['includes', 'headers', 'tests'],
      reactMappings,
    );
    totalLinkedCount += reactCount;
    console.log(`Created ${reactCount} hard links from React folder`);
  }

  // 2. Process Libraries folder with custom mapping for RCTRequired
  const librariesPath = path.join(reactNativePath, 'Libraries');
  if (fs.existsSync(librariesPath)) {
    console.log('Processing Libraries folder...');

    // Define custom mappings for Libraries folder
    const librariesMappings = {
      'Required/': path.join(headersOutput, 'RCTRequired'),
      'TypeSafety/': path.join(headersOutput, 'RCTTypeSafety'),
      'FBLazyVector/': path.join(headersOutput, 'FBLazyVector'),
      'FBReactNativeSpec/': path.join(headersOutput, 'FBReactNativeSpec'),
    };

    const librariesCount = hardlinkHeadersFromPath(
      librariesPath,
      reactHeadersOutput,
      false,
      ['tests'],
      librariesMappings,
    );
    totalLinkedCount += librariesCount;
    console.log(`Created ${librariesCount} hard links from Libraries folder`);
  }

  // 3. Process ReactApple folder - special structure preservation
  const reactApplePath = path.join(reactNativePath, 'ReactApple');
  if (fs.existsSync(reactApplePath)) {
    console.log('Processing ReactApple folder...');
    const reactAppleCount = hardlinkReactAppleHeaders(
      reactApplePath,
      headersOutput,
    );
    totalLinkedCount += reactAppleCount;
    console.log(`Created ${reactAppleCount} hard links from ReactApple folder`);
  }

  // 4. Process ReactCommon folder - conditional structure preservation
  const reactCommonPath = path.join(reactNativePath, 'ReactCommon');
  if (fs.existsSync(reactCommonPath)) {
    console.log('Processing ReactCommon folder...');
    // Define paths that should be flattened in ReactCommon folder
    const flattenPaths = ['react/nativemodule/core/platform/ios'];
    // Define special mappings for flattening specific directories
    const specialMapping = {
      'yoga/': 'yoga',
      'cxxreact/': 'cxxreact',
      'jsinspector-modern/': 'jsinspector-modern',
      'jserrorhandler/': 'jserrorhandler',
      'oscompat/': 'oscompat',
    };
    const reactCommonCount = hardlinkReactCommonHeaders(
      reactCommonPath,
      headersOutput,
      flattenPaths,
      specialMapping,
    );
    totalLinkedCount += reactCommonCount;
    console.log(
      `Created ${reactCommonCount} hard links from ReactCommon folder`,
    );
  }

  console.log(
    `Created hard links for ${totalLinkedCount} React Native headers total`,
  );
}

/**
 * Helper function to create hard links from a source path
 * @param {string} sourcePath - Source directory to search for headers
 * @param {string} outputPath - Default output directory for hard links
 * @param {boolean} preserveStructure - Whether to preserve directory structure
 * @param {Array<string>} excludeFolders - Folder names to exclude
 * @param {Object} customMappings - Custom path mappings (prefix -> output path)
 * @returns {number} Number of hard links created
 */
function hardlinkHeadersFromPath(
  sourcePath /*: string */,
  outputPath /*: string */,
  preserveStructure /*: boolean */,
  excludeFolders /*: Array<string> */,
  customMappings /*: {[string]: string} */ = {},
) /*: number */ {
  let linkedCount = 0;

  try {
    // Build find command with exclusions
    let findCommand = `find "${sourcePath}" -name "*.h" -type f`;

    // Add exclusions for specified folders
    excludeFolders.forEach(folder => {
      findCommand += ` | grep -v "/${folder}/"`;
    });

    const result = execSync(findCommand, {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const headerFiles = result
      .trim()
      .split('\n')
      .filter(p => p.length > 0);

    headerFiles.forEach(sourceHeaderPath => {
      if (fs.existsSync(sourceHeaderPath)) {
        const relativePath = path.relative(sourcePath, sourceHeaderPath);
        let destPath;
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
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, {recursive: true});
        }

        // Remove existing hard link if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }

        // Create hard link
        fs.linkSync(sourceHeaderPath, destPath);
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
 * Create hard links for ReactApple headers with special path logic
 * Keeps the last path component before "Exported" as a subdirectory
 * @param {string} reactApplePath - Path to ReactApple directory
 * @param {string} headersOutput - Base headers output directory
 * @returns {number} Number of hard links created
 */
function hardlinkReactAppleHeaders(
  reactApplePath /*: string */,
  headersOutput /*: string */,
) /*: number */ {
  let linkedCount = 0;

  console.log(`Searching for headers in: ${reactApplePath}`);

  try {
    const result = execSync(
      `find "${reactApplePath}" -name "*.h" -type f | grep -v "/tests/"`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    const headerFiles = result
      .trim()
      .split('\n')
      .filter(p => p.length > 0);
    console.log(`Found ${headerFiles.length} header files in ReactApple`);

    headerFiles.forEach(sourceHeaderPath => {
      if (fs.existsSync(sourceHeaderPath)) {
        // Calculate relative path from ReactApple base
        const relativePath = path.relative(reactApplePath, sourceHeaderPath);
        console.log(`Processing: ${relativePath}`);

        // Split path into components
        const pathComponents = relativePath.split(path.sep);

        // Find "Exported" component
        const exportedIndex = pathComponents.findIndex(
          component => component === 'Exported',
        );

        let destPath;
        const headerName = path.basename(sourceHeaderPath);

        if (exportedIndex !== -1 && exportedIndex > 0) {
          // Get the component immediately before "Exported"
          const lastComponentBeforeExported = pathComponents[exportedIndex - 1];
          destPath = path.join(
            headersOutput,
            lastComponentBeforeExported,
            headerName,
          );
          console.log(
            `  -> ${lastComponentBeforeExported}/${headerName} (preserved component before Exported)`,
          );
        } else {
          // If no "Exported" found, flatten to headers folder
          destPath = path.join(headersOutput, headerName);
          console.log(`  -> ${headerName} (no Exported found, flattened)`);
        }

        const destDir = path.dirname(destPath);

        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, {recursive: true});
        }

        // Remove existing hard link if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }

        try {
          // Create hard link
          fs.linkSync(sourceHeaderPath, destPath);
          linkedCount++;
        } catch (linkError) {
          console.warn(
            `Failed to create hard link from ${sourceHeaderPath} to ${destPath}: ${linkError.message}`,
          );
        }
      }
    });
  } catch (error) {
    console.warn(`Failed to process ReactApple headers:`, error.message);
  }

  console.log(`Created ${linkedCount} hard links from ReactApple`);
  return linkedCount;
}

/**
 * Create hard links for ReactCommon headers with conditional path logic
 * @param {string} reactCommonPath - Path to ReactCommon directory
 * @param {string} headersOutput - Base headers output directory
 * @param {Array<string>} flattenPaths - Array of relative paths that should be flattened in ReactCommon folder
 * @param {Object} specialMapping - Map of prefix -> destination folder for special cases
 * @returns {number} Number of hard links created
 */
function hardlinkReactCommonHeaders(
  reactCommonPath /*: string */,
  headersOutput /*: string */,
  flattenPaths /*: Array<string> */ = [],
  specialMapping /*: {[string]: string} */ = {},
) /*: number */ {
  let linkedCount = 0;

  console.log(`Searching for headers in: ${reactCommonPath}`);
  console.log(`Flatten paths: ${flattenPaths.join(', ')}`);

  try {
    const result = execSync(
      `find "${reactCommonPath}" -name "*.h" -type f | grep -v "/tests/"`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    const headerFiles = result
      .trim()
      .split('\n')
      .filter(p => p.length > 0);
    console.log(`Found ${headerFiles.length} header files in ReactCommon`);

    // Create ReactCommon subdirectory for headers that should go there
    const reactCommonHeadersOutput = path.join(headersOutput, 'ReactCommon');
    if (!fs.existsSync(reactCommonHeadersOutput)) {
      fs.mkdirSync(reactCommonHeadersOutput, {recursive: true});
    }

    headerFiles.forEach(sourceHeaderPath => {
      if (fs.existsSync(sourceHeaderPath)) {
        // Calculate relative path from ReactCommon base
        const relativePath = path.relative(reactCommonPath, sourceHeaderPath);

        let destPath;

        // Check for ReactCommon/**/ReactCommon/header.h pattern
        // Since relativePath is calculated from ReactCommon base, any "ReactCommon" component
        // in the relative path indicates a nested ReactCommon folder
        const pathComponents = relativePath.split(path.sep);
        const hasNestedReactCommon = pathComponents.includes('ReactCommon');

        if (hasNestedReactCommon) {
          // Handle ReactCommon/**/ReactCommon/header.h pattern - flatten to ReactCommon folder
          const headerName = path.basename(sourceHeaderPath);
          destPath = path.join(reactCommonHeadersOutput, headerName);
          console.log(
            `  -> ReactCommon/${headerName} (flattened from nested ReactCommon pattern: ${relativePath})`,
          );
        } else {
          // Check if path should be flattened in ReactCommon folder
          const shouldFlatten = flattenPaths.some(flattenPath => {
            const matchPattern = flattenPath + '/';
            const matches = relativePath.startsWith(matchPattern);
            if (matches) {
              console.log(
                `  Flattening: ${relativePath} (matches ${flattenPath})`,
              );
            }
            return matches;
          });

          if (shouldFlatten) {
            // Flatten to ReactCommon folder
            const headerName = path.basename(sourceHeaderPath);
            destPath = path.join(reactCommonHeadersOutput, headerName);
            console.log(`  -> ${headerName} (flattened to ReactCommon)`);
          } else if (relativePath.startsWith('react/')) {
            // Handle Switch special case
            if (relativePath.startsWith('react/renderer/components/switch')) {
              if (relativePath.includes('androidswitch')) {
                return;
              }

              destPath = path.join(
                headersOutput,
                'react',
                'renderer',
                'components',
                'switch',
              );

              // the header files are in the react/renderer/components/switch/iosswitch/react/renderer/components/switch
              // we need the header file.
              let headerFileName = path.basename(relativePath);
              destPath = path.join(destPath, headerFileName);

              console.log(
                `  -> react/renderer/components/switch/${headerFileName} handling special switch case)`,
              );
            } else {
              // Handle platform-specific headers with pattern:
              // react/renderer/components/view/platform/{cxx,android}/react/renderer/components/view/header.h
              const platformMatch = relativePath.match(
                /^(react\/.*?)\/platform\/([^/]+)\/react\/(.*)$/,
              );

              if (platformMatch) {
                const [, , platform, remainingPath] = platformMatch;
                const supportedPlatforms = ['ios', 'cxx'];
                const ignoredPlatforms = ['android', 'windows', 'macos'];

                if (supportedPlatforms.includes(platform)) {
                  // Flatten to headers/react/renderer/components/view/
                  destPath = path.join(headersOutput, 'react', remainingPath);
                  console.log(
                    `  -> react/${remainingPath} (flattened from platform-specific ${platform})`,
                  );
                } else if (ignoredPlatforms.includes(platform)) {
                  // Skip headers for ignored platforms
                  console.log(
                    `  -> Skipping header for ignored platform: ${platform}`,
                  );
                  return; // Skip this header file
                } else {
                  // Unknown platform, preserve the original structure
                  destPath = path.join(headersOutput, relativePath);
                  console.log(
                    `  -> ${relativePath} (unknown platform: ${platform}, preserved structure)`,
                  );
                }
              } else {
                // If path starts with 'react/' but doesn't match platform pattern, preserve the relative path under headers/
                destPath = path.join(headersOutput, relativePath);
                console.log(`  -> ${relativePath} (preserved under headers/)`);
              }
            }
          } else {
            // Check for special mappings
            let specialCaseMatched = false;
            for (const [prefix, destinationFolder] of Object.entries(
              specialMapping,
            )) {
              if (relativePath.startsWith(prefix)) {
                let mappedPath = relativePath;

                // Special handling for yoga - remove duplicated yoga/ prefix
                if (
                  prefix === 'yoga/' &&
                  relativePath.startsWith('yoga/yoga/')
                ) {
                  mappedPath = relativePath.substring(5); // Remove 'yoga/' (5 characters)
                }

                destPath = path.join(
                  headersOutput,
                  destinationFolder,
                  mappedPath.substring(prefix.length),
                );
                console.log(
                  `  -> ${destinationFolder}/${mappedPath.substring(prefix.length)} (${prefix.slice(0, -1)} headers flattened, bypassing ReactCommon)`,
                );
                specialCaseMatched = true;
                break;
              }
            }

            if (!specialCaseMatched) {
              // Otherwise, put it under headers/ReactCommon/ with structure preserved
              destPath = path.join(reactCommonHeadersOutput, relativePath);
              console.log(
                `  -> ReactCommon/${relativePath} (structured under ReactCommon)`,
              );
            }
          }
        }

        const destDir = path.dirname(destPath);

        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, {recursive: true});
        }

        // Remove existing hard link if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }

        try {
          // Create hard link
          fs.linkSync(sourceHeaderPath, destPath);
          linkedCount++;
        } catch (linkError) {
          console.warn(
            `Failed to create hard link from ${sourceHeaderPath} to ${destPath}: ${linkError.message}`,
          );
        }
      }
    });
  } catch (error) {
    console.warn(`Failed to process ReactCommon headers:`, error.message);
  }

  console.log(`Created ${linkedCount} hard links from ReactCommon`);
  return linkedCount;
}

/**
 * Create hard links for third-party dependencies headers in the output folder
 * @param {string} reactNativePath - Path to the React Native directory
 * @param {string} outputFolder - Path to the output folder
 * @param {string} folderName - Name of the folder where headers will be created (default: 'headers')
 */
function hardlinkThirdPartyDependenciesHeaders(
  reactNativePath /*: string */,
  outputFolder /*: string */,
  folderName /*: string */ = 'headers',
) /*: void */ {
  console.log('Creating hard links for Third-Party Dependencies headers...');

  // Look for ReactNativeDependencies.xcframework/Headers folder specifically
  const thirdPartyHeadersPath = path.join(
    reactNativePath,
    'third-party',
    'ReactNativeDependencies.xcframework',
    'Headers',
  );

  if (!fs.existsSync(thirdPartyHeadersPath)) {
    console.warn(
      `Third-party dependencies headers path does not exist: ${thirdPartyHeadersPath}`,
    );
    return;
  }

  const headersOutput = path.join(outputFolder, folderName);
  if (!fs.existsSync(headersOutput)) {
    fs.mkdirSync(headersOutput, {recursive: true});
  }

  // Find all .h and .hpp files recursively in third-party headers, exclude 'tests' folders
  try {
    const result = execSync(
      `find "${thirdPartyHeadersPath}" \\( -name "*.h" -o -name "*.hpp" \\) -type f | grep -v "/tests/"`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    const headerFiles = result
      .trim()
      .split('\n')
      .filter(p => p.length > 0);
    let linkedCount = 0;

    headerFiles.forEach(sourcePath => {
      if (fs.existsSync(sourcePath)) {
        // Calculate relative path from Headers base to preserve structure
        const relativePath = path.relative(thirdPartyHeadersPath, sourcePath);
        const destPath = path.join(headersOutput, relativePath);
        const destDir = path.dirname(destPath);

        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, {recursive: true});
        }

        // Remove existing hard link if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }

        // Create hard link
        fs.linkSync(sourcePath, destPath);
        linkedCount++;
      }
    });

    console.log(
      `Created hard links for ${linkedCount} Third-Party Dependencies headers with preserved directory structure`,
    );
  } catch (error) {
    console.warn(
      'Failed to create hard links for third-party dependencies headers:',
      error.message,
    );
  }
}

/**
 * Create hard links for Codegen headers in the output folder
 */
function hardlinkCodegenHeaders(
  reactNativePath /*: string */,
  iosAppPath /*: string */,
  outputFolder /*: string */,
) /*: void */ {
  console.log('Creating hard links for Codegen headers...');

  // Look for ReactCodegen folder specifically
  const reactCodegenPath = path.join(
    iosAppPath,
    'build',
    'generated',
    'ios',
    'ReactCodegen',
  );

  if (!fs.existsSync(reactCodegenPath)) {
    console.warn(`ReactCodegen path does not exist: ${reactCodegenPath}`);
    return;
  }

  const headersOutput = path.join(outputFolder, 'headers');
  if (!fs.existsSync(headersOutput)) {
    fs.mkdirSync(headersOutput, {recursive: true});
  }

  // Create ReactCodegen subdirectory for headers without subpaths
  const reactCodegenHeadersOutput = path.join(headersOutput, 'ReactCodegen');
  if (!fs.existsSync(reactCodegenHeadersOutput)) {
    fs.mkdirSync(reactCodegenHeadersOutput, {recursive: true});
  }

  // Find all .h files recursively in ReactCodegen, excluding any 'headers' and 'tests' folders
  try {
    const result = execSync(
      `find "${reactCodegenPath}" -name "*.h" -type f | grep -v "/headers/" | grep -v "/tests/"`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );

    const headerFiles = result
      .trim()
      .split('\n')
      .filter(p => p.length > 0);
    let linkedCount = 0;

    headerFiles.forEach(sourcePath => {
      if (fs.existsSync(sourcePath)) {
        // Calculate relative path from ReactCodegen base
        const relativePath = path.relative(reactCodegenPath, sourcePath);

        let destPath;

        // If relative path contains no subpath (just a filename), put it in ReactCodegen folder
        if (path.dirname(relativePath) === '.') {
          destPath = path.join(reactCodegenHeadersOutput, relativePath);
        } else {
          // Otherwise, preserve the structure under headers/
          destPath = path.join(headersOutput, relativePath);
        }

        const destDir = path.dirname(destPath);

        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, {recursive: true});
        }

        // Remove existing hard link if it exists
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }

        // Create hard link
        fs.linkSync(sourcePath, destPath);
        linkedCount++;
      }
    });

    console.log(
      `Created hard links for ${linkedCount} Codegen headers with conditional directory structure`,
    );
  } catch (error) {
    console.warn(
      'Failed to create hard links for codegen headers:',
      error.message,
    );
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length !== 4) {
    console.error(
      'Usage: node prepare-app-dependencies-headers.js <react-native-path> <ios-app-path> <output-folder> <required-headers>',
    );
    console.error(
      '  required-headers: react-native | codegen | third-party-dependencies | all',
    );
    process.exit(1);
  }

  const [reactNativePath, iosAppPath, outputFolder, requiredHeaders] = args;

  try {
    prepareAppDependenciesHeaders(
      reactNativePath,
      iosAppPath,
      outputFolder,
      requiredHeaders,
    );
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  prepareAppDependenciesHeaders,
  hardlinkReactNativeHeaders,
  hardlinkThirdPartyDependenciesHeaders,
};
