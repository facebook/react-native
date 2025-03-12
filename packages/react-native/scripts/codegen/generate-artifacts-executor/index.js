/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script crawls through a React Native application's dependencies and invokes the codegen
 * for any libraries that require it.
 * To enable codegen support, the library should include a config in the codegenConfig key
 * in a package.json file.
 */

const {
  generateAppDependencyProvider,
} = require('./generateAppDependencyProvider');
const {generateCustomURLHandlers} = require('./generateCustomURLHandlers');
const {generateNativeCode} = require('./generateNativeCode');
const {generateRCTModuleProviders} = require('./generateRCTModuleProviders');
const {
  generateRCTThirdPartyComponents,
} = require('./generateRCTThirdPartyComponents');
const {generateReactCodegenPodspec} = require('./generateReactCodegenPodspec');
const {generateSchemaInfos} = require('./generateSchemaInfos');
const {
  buildCodegenIfNeeded,
  cleanupEmptyFilesAndFolders,
  codegenLog,
  findCodegenEnabledLibraries,
  pkgJsonIncludesGeneratedCode,
  readPkgJsonInDirectory,
} = require('./utils');
const path = require('path');

/**
 * This function is the entry point for the codegen. It:
 * - reads the package json
 * - extracts the libraries
 * - setups the CLI to generate the code
 * - generate the code
 *
 * @parameter projectRoot: the directory with the app source code, where the package.json lives.
 * @parameter baseOutputPath: the base output path for the CodeGen.
 * @parameter targetPlatform: the target platform. Supported values: 'android', 'ios', 'all'.
 * @parameter source: the source that is invoking codegen. Supported values: 'app', 'library'.
 * @throws If it can't find a config file for react-native.
 * @throws If it can't find a CodeGen configuration in the file.
 * @throws If it can't find a cli for the CodeGen.
 */
function execute(
  projectRoot,
  targetPlatform,
  baseOutputPath,
  source,
  runReactNativeCodegen = true,
) {
  try {
    codegenLog(`Analyzing ${path.join(projectRoot, 'package.json')}`);

    const supportedPlatforms = ['android', 'ios'];
    if (
      targetPlatform !== 'all' &&
      !supportedPlatforms.includes(targetPlatform)
    ) {
      throw new Error(
        `Invalid target platform: ${targetPlatform}. Supported values are: ${supportedPlatforms.join(
          ', ',
        )}, all`,
      );
    }

    const pkgJson = readPkgJsonInDirectory(projectRoot);

    if (runReactNativeCodegen) {
      buildCodegenIfNeeded();
    }

    const libraries = findCodegenEnabledLibraries(pkgJson, projectRoot);

    if (libraries.length === 0) {
      codegenLog('No codegen-enabled libraries found.', true);
      return;
    }

    let platforms =
      targetPlatform === 'all' ? supportedPlatforms : [targetPlatform];

    for (const platform of platforms) {
      const outputPath = computeOutputPath(
        projectRoot,
        baseOutputPath,
        pkgJson,
        platform,
      );

      if (runReactNativeCodegen) {
        const schemaInfos = generateSchemaInfos(libraries);
        generateNativeCode(
          outputPath,
          schemaInfos.filter(schemaInfo =>
            mustGenerateNativeCode(projectRoot, schemaInfo),
          ),
          pkgJsonIncludesGeneratedCode(pkgJson),
          platform,
        );
      }

      if (source === 'app') {
        // These components are only required by apps, not by libraries
        generateRCTThirdPartyComponents(libraries, outputPath);
        generateRCTModuleProviders(projectRoot, pkgJson, libraries, outputPath);
        generateCustomURLHandlers(libraries, outputPath);
        generateAppDependencyProvider(outputPath);
      }
      generateReactCodegenPodspec(
        projectRoot,
        pkgJson,
        outputPath,
        baseOutputPath,
      );

      cleanupEmptyFilesAndFolders(outputPath);
    }
  } catch (err) {
    codegenLog(err);
    process.exitCode = 1;
  }

  codegenLog('Done.', true);
  return;
}

function readOutputDirFromPkgJson(pkgJson, platform) {
  const codegenConfig = pkgJson.codegenConfig;
  if (codegenConfig == null || typeof codegenConfig !== 'object') {
    return null;
  }
  const outputDir = codegenConfig.outputDir;
  if (outputDir == null) {
    return null;
  }
  if (typeof outputDir === 'string') {
    return outputDir;
  }
  if (typeof outputDir === 'object') {
    return outputDir[platform];
  }
  return null;
}

function computeOutputPath(projectRoot, baseOutputPath, pkgJson, platform) {
  if (baseOutputPath == null) {
    const outputDirFromPkgJson = readOutputDirFromPkgJson(pkgJson, platform);
    if (outputDirFromPkgJson != null) {
      baseOutputPath = path.join(projectRoot, outputDirFromPkgJson);
    } else {
      baseOutputPath = projectRoot;
    }
  }
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    // Don't create nested directories for libraries to make importing generated headers easier.
    return baseOutputPath;
  }
  if (platform === 'android') {
    return defaultOutputPathForAndroid(baseOutputPath);
  }
  if (platform === 'ios') {
    return defaultOutputPathForIOS(baseOutputPath);
  }
  return baseOutputPath;
}

function defaultOutputPathForAndroid(baseOutputPath) {
  return path.join(
    baseOutputPath,
    'android',
    'app',
    'build',
    'generated',
    'source',
    'codegen',
  );
}

function defaultOutputPathForIOS(baseOutputPath) {
  return path.join(baseOutputPath, 'build', 'generated', 'ios');
}

function mustGenerateNativeCode(includeLibraryPath, schemaInfo) {
  // If library's 'codegenConfig' sets 'includesGeneratedCode' to 'true',
  // then we assume that native code is shipped with the library,
  // and we don't need to generate it.
  return (
    schemaInfo.library.libraryPath === includeLibraryPath ||
    !schemaInfo.library.config.includesGeneratedCode
  );
}

module.exports = {
  execute,
};
