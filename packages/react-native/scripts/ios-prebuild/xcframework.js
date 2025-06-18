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

const {createFolderIfNotExists, createLogger} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const frameworkLog = createLogger('XCFramework');

// These are the headers that are ignored by the modulemap.
// The modulemap is required only for Swift files that needs to import the React framework.
// We want to ignore all the headers that contains some C++ symbol, as they will not build with Swift.
const HEADERFILE_IGNORE_LIST = [
  'RCTCxxMethod.h',
  'RCTComponentViewClassDescriptor.h',
  'RCTActivityIndicatorViewManager.h',
  'RCTComponentViewDescriptor.h',
  'RCTComponentViewFactory.h',
  'RCTComponentViewProtocol.h',
  'RCTComponentViewRegistry.h',
  'RCTConstants.h',
  'RCTConversions.h',
  'RCTConvert+CoreLocation.h',
  'RCTConvert+Text.h',
  'RCTConvert+Transform.h',
  'RCTFabricComponentsPlugins.h',
  'RCTFabricModalHostViewController.h',
  'RCTFabricSurface.h',
  'RCTFollyConvert.h',
  'RCTLegacyViewManagerInteropCoordinatorAdapter.h',
  'RCTLinearGradient.h',
  'RCTRadialGradient.h',
  'RCTMountingManager.h',
  'RCTMountingTransactionObserving.h',
  'RCTParagraphComponentAccessibilityProvider.h',
  'RuntimeExecutor.h',
  'RCTSurfacePresenter.h',
  'RCTSurfacePresenterBridgeAdapter.h',
  '*View.h',
  '*ViewProtocol.h',
  '*ComponentView.h',
  'RCTViewAccessibilityElement.h',
  'RCTImageManager*.h',
  'RCTImagePrimitivesConversions.h',
  'RCTSyncImageManager.h',
  'CallbackWrapper.h',
  'LongLivedObject.h',
  'Bridging.h',
  'RCTLegacyViewManagerInteropCoordinator.h',
  'conversions.h',
  'Float.h',
  'Geometry.h',
  'ObjCTimerRegistry.h',
  'RCTContextContainerHandling.h',
  'RCTHost*.h',
  'ReactCdp.h',
  'RCTInstance.h',
  'JsArgumentHelpers-inl.h',
  'RCTJscInstance.h',
  'RCTJSThreadManager.h',
  'YGEnums.h',
  'YGNode.h',
];

function buildXCFrameworks(
  rootFolder /*: string */,
  buildFolder /*: string */,
  frameworkFolders /*: Array<string> */,
  buildType /*: BuildFlavor */,
  identity /*: ?string */,
) {
  const outputPath = path.join(
    buildFolder,
    'output',
    'xcframeworks',
    buildType,
    'React.xcframework',
  );
  // Delete all target platform folders (everything but the Headers and Modules folders)
  cleanPlatformFolders(outputPath);

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

  // Copy header files from the headers folder that we used to build the swift package
  const outputHeaderFiles = copyHeaderFiles(
    path.join(buildFolder, 'Headers'),
    outputPath,
    true,
  );

  // Create the umbrella header file
  const umbrellaHeaderFile = createUmbrellaHeaderFile(
    outputPath,
    outputHeaderFiles,
  );

  // Create the module map file
  const moduleMapFile = createModuleMapFile(outputPath, umbrellaHeaderFile);
  if (!moduleMapFile) {
    frameworkLog(
      'Failed to create module map file. The XCFramework may not work correctly. Stopping.',
      'error',
    );
    return;
  }

  // Get the platforms in the framework folder and copy modulemaps and headers into each platform folder
  linkArchFolders(
    outputPath,
    moduleMapFile,
    umbrellaHeaderFile,
    outputHeaderFiles,
  );

  // Copy Symbols to symbols folder
  const symbolPaths = frameworkFolders.map(framework =>
    path.join(framework, `..`, `..`, `React.framework.dSYM`),
  );
  console.log('Copying symbols to symbols folder...');
  const symbolOutput = path.join(outputPath, '../..', 'Symbols');
  symbolPaths.forEach(symbol => {
    const destination = extractDestinationFromPath(symbol);
    const outputFolder = path.join(symbolOutput, destination);
    fs.mkdirSync(outputFolder, {recursive: true});
    execSync(`cp -r ${symbol} ${outputFolder}`);
  });

  if (identity) {
    signXCFramework(identity, outputPath);
  }
}

function linkArchFolders(
  outputPath /*:string*/,
  moduleMapFile /*:string*/,
  umbrellaHeaderFile /*:string*/,
  outputHeaderFiles /*: Array<string> */,
) {
  frameworkLog('Linking modules and headers to platform folders...');
  const headerRootFolder = path.dirname(umbrellaHeaderFile);

  fs.readdirSync(outputPath)
    .filter(folder => {
      const folderPath = path.join(outputPath, folder);
      return (
        fs.statSync(folderPath).isDirectory() &&
        folder !== 'Headers' &&
        folder !== 'Modules'
      );
    })
    .forEach(folder => {
      // Get full platform folder path
      const platformFolder = path.join(outputPath, folder);
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
          `Error copying module map file: ${error.message}. Check if the file exists.`,
          'error',
        );
      }
      // Copy headers folder into the platform folder
      const targetHeadersFolder = path.join(
        platformFolder,
        'React.Framework',
        'Headers',
      );
      // Link header files into the platform folder
      outputHeaderFiles.forEach(headerFile => {
        // Get the relative path of the header file based on the root folder
        const relativePath = path.relative(headerRootFolder, headerFile);
        // Create the target folder for the header file
        const targetFolder = path.join(
          targetHeadersFolder,
          path.dirname(relativePath),
        );
        // Create the target folder if it doesn't exist
        createFolderIfNotExists(targetFolder);
        // Link the header file to the target folder
        try {
          fs.linkSync(
            headerFile,
            path.join(targetFolder, path.basename(headerFile)),
          );
        } catch (error) {
          frameworkLog(
            `Error linking header file: ${error.message}. Check if the file exists.`,
            'error',
          );
        }
      });
      // Link the umbrella header file to the target headers folder
      try {
        const targetUmbrellaPath = path.join(
          targetHeadersFolder,
          'React-umbrella.h',
        );
        fs.linkSync(umbrellaHeaderFile, targetUmbrellaPath);
      } catch (error) {
        frameworkLog(
          `Error linking umbrella header file: ${error.message}. Check if the file exists.`,
          'error',
        );
      }
    });
}

function copyHeaderFiles(
  headersSourceFolder /*: string */,
  outputPath /*: string */,
  cleanOutputPath /*: boolean */ = false,
) {
  // Re-create headers folder in the output XCFramework
  const headersTargetFolder = path.join(outputPath, 'Headers');
  if (cleanOutputPath && fs.existsSync(headersTargetFolder)) {
    // Delete the headers folder if it exists
    try {
      fs.rmSync(headersTargetFolder, {recursive: true, force: true});
    } catch (error) {
      frameworkLog(
        `Error deleting headers folder: ${error.message}. Check if the folder exists.`,
        'warning',
      );
    }
  }
  createFolderIfNotExists(headersTargetFolder);

  // Now we can copy headers to the headers folder. We need to create the same folder structure as in the
  // header files inside the Headers folder:
  frameworkLog('Copying header files to: ' + headersTargetFolder);
  const headerFiles = glob.sync('**/*.{h,hpp}', {
    cwd: headersSourceFolder,
    absolute: true,
  });

  const outputHeaderFiles /*: Array<string> */ = [];
  headerFiles.forEach(headerFile => {
    // The headerFile is a full path to a header file. We need to get the relative path based on the
    // rootpath parameter.
    const relativePath = path.relative(headersSourceFolder, headerFile);
    const targetFolder = path.join(
      headersTargetFolder,
      path.dirname(relativePath),
    );
    const targetFile = path.join(headersTargetFolder, relativePath);
    createFolderIfNotExists(targetFolder);
    try {
      // Check if the file contains c++ code
      fs.copyFileSync(headerFile, targetFile);
      outputHeaderFiles.push(targetFile);
    } catch (error) {
      frameworkLog(
        `Error copying header file: ${error.message}. Check if the file exists.`,
        'warning',
      );
    }
  });

  return outputHeaderFiles;
}

function createUmbrellaHeaderFile(
  outputPath /*: string */,
  headerFiles /*: Array<string> */,
) /*: string */ {
  // Create the umbrella header file
  const umbrellaHeaderPath = path.join(outputPath, 'Headers');
  const umbrellaHeaderFile = path.join(umbrellaHeaderPath, 'React-umbrella.h');

  frameworkLog('Creating umbrella header file: ' + umbrellaHeaderFile);

  // Create the umbrella header file
  let umbrellaHeader = `
// Generated by React Native
// Do not edit this file directly. It is generated by the React Native build process.

#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

`;
  headerFiles.forEach(headerFile => {
    if (!isCppHeaderFile(headerFile) && !isHeaderFileIgnored(headerFile)) {
      // The headerFile is a full path to a header file. We need to get the relative path based on the
      // rootpath parameter.
      const relativePath = path.relative(umbrellaHeaderPath, headerFile);
      umbrellaHeader += `#import "${relativePath}"\n`;
    }
  });
  umbrellaHeader += '\n';

  // Write out the umbrella header file
  try {
    fs.writeFileSync(umbrellaHeaderFile, umbrellaHeader);
  } catch (error) {
    frameworkLog(
      `Error creating umbrella header file: ${error.message}. Check if the file exists.`,
      'warning',
    );
  }

  return umbrellaHeaderFile;
}

const cppHeaderRegex =
  /(#include|#import)\s*<[^.>]+>|\bnamespace\s+[\w:]+::|NS_ENUM\s*\([^)]*\)|NS_OPTIONS\s*\([^)]*\)|typedef\s+enum|static\s+const|@interface|static\s+inline/;

function isCppHeaderFile(headerFilePath /*: string */) /*: boolean */ {
  // Check if there is a cpp or mm file with the same name
  const fileName = path.basename(headerFilePath, path.extname(headerFilePath));
  const dirName = path.dirname(headerFilePath);

  const checkFileExists = (extension /*: string */) /*: boolean */ => {
    const cppFilePath = path.join(dirName, fileName + extension);
    if (fs.existsSync(cppFilePath)) {
      const fileStat = fs.statSync(cppFilePath);
      return fileStat.isFile();
    }
    return false;
  };
  if (checkFileExists('.cpp') || checkFileExists('.mm')) {
    // If there is a cpp or mm file with the same name, we assume it is a C++ header file
    return true;
  }
  // Check if the file contains c++ code
  const fileContent = fs.readFileSync(headerFilePath, 'utf8');
  return cppHeaderRegex.test(fileContent);
}

function isHeaderFileIgnored(headerFile /*: string */) /*: boolean */ {
  // Check if the header file is in the ignore list
  return HEADERFILE_IGNORE_LIST.some(pattern =>
    // Glob match the header file name to the ignore list
    glob
      .sync(pattern, {
        cwd: path.dirname(headerFile),
        absolute: true,
      })
      .some(ignoredHeaderFile => {
        return path.basename(headerFile) === path.basename(ignoredHeaderFile);
      }),
  );
}

function createModuleMapFile(
  outputPath /*: string */,
  umbrellaPath /*: string */,
) {
  // Create/get the module map folder
  const moduleMapFolder = path.join(outputPath, 'Modules');
  createFolderIfNotExists(moduleMapFolder);

  // Create the module map file
  const moduleMapFile = path.join(moduleMapFolder, 'module.modulemap');
  frameworkLog('Creating module map file: ' + moduleMapFile);
  const moduleMapContent = `framework module React {
    umbrella header "${path.basename(umbrellaPath)}"
    export *
    module * { export * }
}`;

  try {
    fs.writeFileSync(moduleMapFile, moduleMapContent);
    return moduleMapFile;
  } catch (error) {
    frameworkLog(
      `Error creating module map file: ${error.message}. Check if the file exists.`,
      'warning',
    );
    return null;
  }
}

function cleanPlatformFolders(outputPath /*:string*/) {
  if (!fs.existsSync(outputPath)) {
    return;
  }
  const targetPlatformFolders = fs.readdirSync(outputPath).filter(folder => {
    const folderPath = path.join(outputPath, folder);
    return (
      fs.statSync(folderPath).isDirectory() &&
      folder !== 'Headers' &&
      folder !== 'Modules'
    );
  });
  targetPlatformFolders.forEach(folder => {
    const folderPath = path.join(outputPath, folder);
    frameworkLog('Deleting folder: ' + folderPath);
    try {
      fs.rmSync(folderPath, {recursive: true, force: true});
    } catch (error) {
      frameworkLog(
        `Error deleting folder: ${folderPath}. Check if the folder exists.`,
        'warning',
      );
    }
  });
}

function extractDestinationFromPath(symbolPath /*: string */) /*: string */ {
  if (symbolPath.includes('iphoneos')) {
    return 'iphoneos';
  }

  if (symbolPath.includes('iphonesimulator')) {
    return 'iphonesimulator';
  }

  if (symbolPath.includes('maccatalyst')) {
    return 'catalyst';
  }

  throw new Error(
    `Impossible to extract destination from ${symbolPath}. Valid destinations are iphoneos, iphonesimulator and catalyst.`,
  );
}

function signXCFramework(
  identity /*: string */,
  xcframeworkPath /*: string */,
) {
  console.log('Signing XCFramework...');
  const command = `codesign --timestamp --sign "${identity}" ${xcframeworkPath}`;
  execSync(command, {stdio: 'inherit'});
}

module.exports = {
  buildXCFrameworks,
};
