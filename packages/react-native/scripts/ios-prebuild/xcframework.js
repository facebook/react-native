/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor} from './types'; */

const {
  generateFBReactNativeSpecIOS,
} = require('../codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS');
const headers = require('./headers');
const utils = require('./utils');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const {execSync} = childProcess;
const {getHeaderFilesFromPodspecs} = headers;
const {createFolderIfNotExists, createLogger} = utils;

const frameworkLog = createLogger('XCFramework');

/**
 * Path to the React umbrella header file.
 * This umbrella header contains ONLY the list of headers that are accessible by Swift, so no C++ construct are allowed in the headers.
 */
const REACT_CORE_UMBRELLA_HEADER_PATH /*: string*/ = path.join(
  __dirname,
  'React-umbrella.h',
);

/**
 * Path to the React umbrella header file.
 * This umbrella header contains ONLY the list of headers that are accessible by Swift, so no C++ construct are allowed in the headers.
 */
const RCT_APP_DELEGATE_UMBRELLA_HEADER_PATH /*: string*/ = path.join(
  __dirname,
  'React_RCTAppDelegate-umbrella.h',
);

const RN_MODULEMAP_PATH /*: string*/ = path.join(__dirname, 'module.modulemap');

function buildXCFrameworks(
  rootFolder /*: string */,
  buildFolder /*: string */,
  frameworkFolders /*: Array<string> */,
  buildType /*: BuildFlavor */,
  identity /*: ?string */,
) {
  // Let's run codegen for FBReactNativeSpec otherwise some headers will be missing
  generateFBReactNativeSpecIOS('.');

  const outputPath = path.join(
    buildFolder,
    'output',
    'xcframeworks',
    buildType,
    'React.xcframework',
  );
  // Delete all target platform folders (everything but the Headers and Modules folders)
  try {
    fs.rmSync(outputPath, {recursive: true, force: true});
  } catch (error) {
    frameworkLog(
      `Error deleting folder: ${outputPath}. Check if the folder exists.`,
      'error',
    );
    return;
  }

  // Build the XCFrameworks by using each framework folder as input
  const frameworks = frameworkFolders
    .map(frameworkFolder => {
      return `-framework "${frameworkFolder}"`;
    })
    .join(' ');

  const buildCommand = `xcodebuild -create-xcframework ${frameworks} -output ${outputPath} -allow-internal-distribution`;

  frameworkLog(buildCommand);
  try {
    execSync(buildCommand, {
      cwd: rootFolder,
      stdio: 'inherit',
    });
  } catch (error) {
    frameworkLog(
      `Error building XCFramework: ${error.message}. Check if the build was successful.`,
      'error',
    );
    return;
  }

  // Use the header files from podspecs
  const podSpecsWithHeaderFiles = getHeaderFilesFromPodspecs(rootFolder);

  // Delete header files to the output path
  const outputHeadersPath = path.join(outputPath, 'Headers');

  // Store umbrella headers keyed on podspec names
  const umbrellaHeaders /*: {[key: string]: string} */ = {};
  const copiedHeaderFilesWithPodspecNames /*: {[key: string]: string[]} */ = {};

  // Enumerate podspecs and copy headers, create umbrella headers and module map file
  Object.keys(podSpecsWithHeaderFiles).forEach(podspec => {
    const headerFiles = podSpecsWithHeaderFiles[podspec];
    if (headerFiles.length > 0) {
      // Get podspec name without directory and extension and make sure it is a valid identifier
      // by replacing any non-alphanumeric characters with an underscore.
      let podSpecName = path
        .basename(podspec, '.podspec')
        .replace(/[^a-zA-Z0-9_]/g, '_');

      // Fix for FBReactNativeSpec. RN expect FBReactNative spec headers
      // To be in a folder named FBReactNativeSpec.
      if (podSpecName === 'React_RCTFBReactNativeSpec') {
        podSpecName = 'FBReactNativeSpec';
      }

      // Create a folder for the podspec in the output headers path
      const podSpecFolder = path.join(outputHeadersPath, podSpecName);
      createFolderIfNotExists(podSpecFolder);

      // Copy each header file to the podspec folder
      copiedHeaderFilesWithPodspecNames[podSpecName] = headerFiles.map(
        headerFile => {
          // Header files shall be flattened into the podSpecFoldder:
          const targetFile = path.join(
            podSpecFolder,
            path.basename(headerFile),
          );
          fs.copyFileSync(headerFile, targetFile);
          return targetFile;
        },
      );
      // Create umbrella header file for the podspec
      const umbrellaHeaderFilename = path.join(
        podSpecFolder,
        podSpecName + '-umbrella.h',
      );

      if (
        podSpecName === 'React_Core' ||
        podSpecName === 'React_RCTAppDelegate'
      ) {
        if (podSpecName === 'React_Core') {
          // Copy the React-umbrella.h file to the umbrella header filename
          fs.copyFileSync(
            REACT_CORE_UMBRELLA_HEADER_PATH,
            umbrellaHeaderFilename,
          );
        } else {
          fs.copyFileSync(
            RCT_APP_DELEGATE_UMBRELLA_HEADER_PATH,
            umbrellaHeaderFilename,
          );
        }

        // Store the umbrella header filename in the umbrellaHeaders object
        umbrellaHeaders[podSpecName] = umbrellaHeaderFilename;
      }
    }
  });

  // Create the module map file using the header files in podSpecsWithHeaderFiles
  const moduleMapFile = createModuleMapFile(outputPath);
  if (!moduleMapFile) {
    frameworkLog(
      'Failed to create module map file. The XCFramework may not work correctly. Stopping.',
      'error',
    );
    return;
  }

  linkArchFolders(
    outputPath,
    moduleMapFile,
    umbrellaHeaders,
    copiedHeaderFilesWithPodspecNames,
  );

  // Copy Symbols to symbols folder
  copySymbols(outputPath, frameworkFolders);

  if (identity) {
    signXCFramework(identity, outputPath);
  }
}

function copySymbols(
  outputPath /*:string*/,
  frameworkFolders /*:Array<string>*/,
) {
  frameworkLog('Copying symbols to symbols folder...');
  const targetArchFolders = fs
    .readdirSync(outputPath)
    .map(p => path.join(outputPath, p))
    .filter(folder => {
      return (
        fs.statSync(folder).isDirectory() &&
        !folder.endsWith('Headers') &&
        !folder.endsWith('Modules')
      );
    });

  const symbolOutput = path.join(outputPath, '..', 'Symbols');
  frameworkFolders.forEach(frameworkFolder => {
    // Get archs for current symbol slice
    const frameworkPlatforms = getArchsFromFramework(
      path.join(frameworkFolder, 'React'),
    );
    if (frameworkPlatforms) {
      const targetFolder = targetArchFolders.find(
        targetArchFolder =>
          getArchsFromFramework(
            path.join(targetArchFolder, 'React.framework', 'React'),
          ) === frameworkPlatforms,
      );
      if (!targetFolder) {
        frameworkLog(
          `No target folder found for symbol slice: ${frameworkFolder}`,
          'error',
        );
        return;
      }
      const targetSymbolPath = path.join(
        symbolOutput,
        path.basename(targetFolder),
      );
      const sourceSymbolPath = path.join(
        frameworkFolder,
        '..',
        '..',
        'React.framework.dSYM',
      );
      console.log(
        `  ${path.relative(outputPath, sourceSymbolPath)} → ${path.basename(targetFolder)}`,
      );
      fs.mkdirSync(targetSymbolPath, {recursive: true});
      execSync(`cp -r ${sourceSymbolPath} ${targetSymbolPath}`);
    }
  });
}

function linkArchFolders(
  outputPath /*:string*/,
  moduleMapFile /*:string*/,
  umbrellaHeaderFiles /*:{[key: string]: string}*/,
  outputHeaderFiles /*: {[key: string]: string[]} */,
) {
  frameworkLog('Linking modules and headers to platform folders...');

  // Enumerate all platform folders in the output path
  const platformFolders = fs
    .readdirSync(outputPath)
    .map(folder => path.join(outputPath, folder))
    .filter(folder => {
      return (
        fs.statSync(folder).isDirectory() &&
        !folder.endsWith('Headers') &&
        !folder.endsWith('Modules')
      );
    });

  platformFolders.forEach(platformFolder => {
    // Link the Modules folder into the platform folder
    const targetModulesFolder = path.join(
      platformFolder,
      'React.Framework',
      'Modules',
    );
    createFolderIfNotExists(targetModulesFolder);

    try {
      fs.linkSync(
        moduleMapFile,
        path.join(targetModulesFolder, path.basename(moduleMapFile)),
      );
    } catch (error) {
      frameworkLog(
        `Error copying module map file: ${error.message}. Check if the file exists at ${moduleMapFile}.`,
        'error',
      );
    }
    // Copy headers folder into the platform folder
    const targetHeadersFolder = path.join(
      platformFolder,
      'React.Framework',
      'Headers',
    );

    // Link umbrella / header files into the platform folder
    Object.keys(umbrellaHeaderFiles).forEach(podSpecName => {
      const umbrellaHeaderFile = umbrellaHeaderFiles[podSpecName];

      // Create the target folder for the umbrella header file
      const targetPodSpecFolder = path.join(targetHeadersFolder, podSpecName);
      createFolderIfNotExists(targetPodSpecFolder);
      // Link the umbrella header file to the target folder
      try {
        fs.linkSync(
          umbrellaHeaderFile,
          path.join(targetPodSpecFolder, path.basename(umbrellaHeaderFile)),
        );
      } catch (error) {
        frameworkLog(
          `Error linking umbrella header file: ${error.message}. Check if the file exists.`,
          'error',
        );
      }
    });

    Object.keys(outputHeaderFiles).forEach(podSpecName => {
      outputHeaderFiles[podSpecName].forEach(headerFile => {
        // Create the target folder for the umbrella header file
        const targetPodSpecFolder = path.join(targetHeadersFolder, podSpecName);
        createFolderIfNotExists(targetPodSpecFolder);
        // Link the header file to the target folder - here we might have a few files with the same name
        // since we're flattening the imports. Yoga has two files - these can be ignored.
        const targetHeaderFile = path.join(
          targetPodSpecFolder,
          path.basename(headerFile),
        );
        if (!fs.existsSync(targetHeaderFile)) {
          try {
            fs.linkSync(headerFile, targetHeaderFile);
          } catch (error) {
            frameworkLog(
              `Error linking header file: ${error.message}. Check if the file exists.`,
              'error',
            );
          }
        }
      });
    });
  });
}

function createModuleMapFile(outputPath /*: string */) {
  // Create/get the module map folder
  const moduleMapFolder = path.join(outputPath, 'Modules');
  createFolderIfNotExists(moduleMapFolder);

  // Create the module map file
  const moduleMapFile = path.join(moduleMapFolder, 'module.modulemap');

  frameworkLog('Creating module map file: ' + moduleMapFile);

  try {
    fs.copyFileSync(RN_MODULEMAP_PATH, moduleMapFile);
    return moduleMapFile;
  } catch (error) {
    frameworkLog(
      `Error creating module map file: ${error.message}. Check if the file exists.`,
      'error',
    );
    return null;
  }
}

function getArchsFromFramework(frameworkPath /*:string*/) {
  try {
    return execSync(`vtool -show-build ${frameworkPath}|grep platform`)
      .toString()
      .split('\n')
      .map(p => p.trim().split(' ')[1])
      .sort((a, b) => a.localeCompare(b))
      .join(' ');
  } catch (error) {
    return '';
  }
}

function signXCFramework(
  identity /*: string */,
  xcframeworkPath /*: string */,
) {
  frameworkLog('Signing XCFramework...');
  const command = `codesign --timestamp --sign "${identity}" ${xcframeworkPath}`;
  execSync(command, {stdio: 'inherit'});
}

module.exports = {
  buildXCFrameworks,
};
