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

const utils = require('./codegen-utils');
const generateSpecsCLIExecutor = require('./generate-specs-cli-executor');
const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

const REACT_NATIVE_REPOSITORY_ROOT = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
);
const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..', '..');
const CODEGEN_REPO_PATH = `${REACT_NATIVE_REPOSITORY_ROOT}/packages/react-native-codegen`;
const RNCORE_CONFIGS = {
  ios: path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, 'ReactCommon'),
  android: path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    'ReactAndroid',
    'build',
    'generated',
    'source',
    'codegen',
  ),
};
const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
  rncore: RNCORE_CONFIGS,
  FBReactNativeSpec: {
    ios: null,
    android: path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'ReactAndroid',
      'build',
      'generated',
      'source',
      'codegen',
    ),
  },
};
const REACT_NATIVE = 'react-native';

const MODULES_PROTOCOLS_H_TEMPLATE_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
  'RCTModulesConformingToProtocolsProviderH.template',
);

const MODULES_PROTOCOLS_MM_TEMPLATE_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
  'RCTModulesConformingToProtocolsProviderMM.template',
);

// HELPERS

function pkgJsonIncludesGeneratedCode(pkgJson) {
  return pkgJson.codegenConfig && pkgJson.codegenConfig.includesGeneratedCode;
}

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

function readPkgJsonInDirectory(dir) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw `[Codegen] Error: ${pkgJsonPath} does not exist.`;
  }
  return JSON.parse(fs.readFileSync(pkgJsonPath));
}

function printDeprecationWarningIfNeeded(dependency) {
  if (dependency === REACT_NATIVE) {
    return;
  }
  console.log(`[Codegen] CodegenConfig Deprecated Setup for ${dependency}.
    The configuration file still contains the codegen in the libraries array.
    If possible, replace it with a single object.
  `);
  console.debug(`BEFORE:
    {
      // ...
      "codegenConfig": {
        "libraries": [
          {
            "name": "libName1",
            "type": "all|components|modules",
            "jsSrcsRoot": "libName1/js"
          },
          {
            "name": "libName2",
            "type": "all|components|modules",
            "jsSrcsRoot": "libName2/src"
          }
        ]
      }
    }

    AFTER:
    {
      "codegenConfig": {
        "name": "libraries",
        "type": "all",
        "jsSrcsRoot": "."
      }
    }
  `);
}

// Reading Libraries
function extractLibrariesFromConfigurationArray(configFile, dependencyPath) {
  return configFile.codegenConfig.libraries.map(config => {
    return {
      config,
      libraryPath: dependencyPath,
    };
  });
}

function extractLibrariesFromJSON(configFile, dependencyPath) {
  if (configFile.codegenConfig == null) {
    return [];
  }
  console.log(`[Codegen] Found ${configFile.name}`);
  if (configFile.codegenConfig.libraries == null) {
    const config = configFile.codegenConfig;
    return [
      {
        config,
        libraryPath: dependencyPath,
      },
    ];
  } else {
    printDeprecationWarningIfNeeded(configFile.name);
    return extractLibrariesFromConfigurationArray(configFile, dependencyPath);
  }
}

const APPLE_PLATFORMS = ['ios', 'macos', 'tvos', 'visionos'];

// Cocoapods specific platform keys
function getCocoaPodsPlatformKey(platformName) {
  if (platformName === 'macos') {
    return 'osx';
  }
  return platformName;
}

function extractSupportedApplePlatforms(dependency, dependencyPath) {
  console.log('[Codegen] Searching for podspec in the project dependencies.');
  const podspecs = glob.sync('*.podspec', {cwd: dependencyPath});

  if (podspecs.length === 0) {
    return;
  }

  // Take the first podspec found
  const podspec = fs.readFileSync(
    path.join(dependencyPath, podspecs[0]),
    'utf8',
  );

  /**
   * Podspec can have platforms defined in two ways:
   * 1. `spec.platforms = { :ios => "11.0", :tvos => "11.0" }`
   * 2. `s.ios.deployment_target = "11.0"`
   *    `s.tvos.deployment_target = "11.0"`
   */
  const supportedPlatforms = podspec
    .split('\n')
    .filter(
      line => line.includes('platform') || line.includes('deployment_target'),
    )
    .join('');

  // Generate a map of supported platforms { [platform]: true/false }
  const supportedPlatformsMap = APPLE_PLATFORMS.reduce(
    (acc, platform) => ({
      ...acc,
      [platform]: supportedPlatforms.includes(
        getCocoaPodsPlatformKey(platform),
      ),
    }),
    {},
  );

  const supportedPlatformsList = Object.keys(supportedPlatformsMap).filter(
    key => supportedPlatformsMap[key],
  );

  if (supportedPlatformsList.length > 0) {
    console.log(
      `[Codegen] Supported Apple platforms: ${supportedPlatformsList.join(
        ', ',
      )} for ${dependency}`,
    );
  }

  return supportedPlatformsMap;
}

function findExternalLibraries(pkgJson) {
  const dependencies = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies,
  };
  // Determine which of these are codegen-enabled libraries
  console.log(
    '[Codegen] Searching for codegen-enabled libraries in the project dependencies.',
  );
  // Handle third-party libraries
  return Object.keys(dependencies).flatMap(dependency => {
    try {
      const configFilePath = require.resolve(
        path.join(dependency, 'package.json'),
      );
      const configFile = JSON.parse(fs.readFileSync(configFilePath));
      const codegenConfigFileDir = path.dirname(configFilePath);
      return extractLibrariesFromJSON(configFile, codegenConfigFileDir);
    } catch (e) {
      return [];
    }
  });
}

function findLibrariesFromReactNativeConfig(projectRoot) {
  const rnConfigFileName = 'react-native.config.js';

  console.log(
    `\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in ${rnConfigFileName}`,
  );

  const rnConfigFilePath = path.resolve(projectRoot, rnConfigFileName);

  if (!fs.existsSync(rnConfigFilePath)) {
    return [];
  }
  const rnConfig = require(rnConfigFilePath);

  if (rnConfig.dependencies == null) {
    return [];
  }
  return Object.keys(rnConfig.dependencies).flatMap(name => {
    const dependencyConfig = rnConfig.dependencies[name];

    if (!dependencyConfig.root) {
      return [];
    }
    const codegenConfigFileDir = path.resolve(
      projectRoot,
      dependencyConfig.root,
    );
    let configFile;
    try {
      configFile = readPkgJsonInDirectory(codegenConfigFileDir);
    } catch {
      return [];
    }

    return extractLibrariesFromJSON(configFile, codegenConfigFileDir);
  });
}

function findProjectRootLibraries(pkgJson, projectRoot) {
  console.log('[Codegen] Searching for codegen-enabled libraries in the app.');

  if (pkgJson.codegenConfig == null) {
    console.log(
      '[Codegen] The "codegenConfig" field is not defined in package.json. Assuming there is nothing to generate at the app level.',
    );
    return [];
  }

  if (typeof pkgJson.codegenConfig !== 'object') {
    throw '[Codegen] The "codegenConfig" field must be an Object.';
  }

  return extractLibrariesFromJSON(pkgJson, projectRoot);
}

// CodeGen
function buildCodegenIfNeeded() {
  if (!fs.existsSync(CODEGEN_REPO_PATH)) {
    return;
  }
  // Assuming we are working in the react-native repo. We might need to build the codegen.
  // This will become unnecessary once we start using Babel Register for the codegen package.
  const libPath = path.join(CODEGEN_REPO_PATH, 'lib');
  if (fs.existsSync(libPath) && fs.readdirSync(libPath).length > 0) {
    return;
  }
  console.log('[Codegen] Building react-native-codegen package.');
  execSync('yarn install', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
  execSync('yarn build', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
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

function reactNativeCoreLibraryOutputPath(libraryName, platform) {
  return CORE_LIBRARIES_WITH_OUTPUT_FOLDER[libraryName]
    ? CORE_LIBRARIES_WITH_OUTPUT_FOLDER[libraryName][platform]
    : null;
}

function generateSchemaInfo(library, platform) {
  const pathToJavaScriptSources = path.join(
    library.libraryPath,
    library.config.jsSrcsDir,
  );
  console.log(`[Codegen] Processing ${library.config.name}`);

  const supportedApplePlatforms = extractSupportedApplePlatforms(
    library.config.name,
    library.libraryPath,
  );

  // Generate one schema for the entire library...
  return {
    library: library,
    supportedApplePlatforms,
    schema: utils
      .getCombineJSToSchema()
      .combineSchemasInFileList(
        [pathToJavaScriptSources],
        platform,
        /NativeSampleTurboModule/,
      ),
  };
}

function shouldSkipGenerationForRncore(schemaInfo, platform) {
  if (platform !== 'ios' || schemaInfo.library.config.name !== 'rncore') {
    return false;
  }
  const rncoreOutputPath = path.join(
    RNCORE_CONFIGS.ios,
    'react',
    'renderer',
    'components',
    'rncore',
  );
  const rncoreAbsolutePath = path.resolve(rncoreOutputPath);
  return (
    rncoreAbsolutePath.includes('node_modules') &&
    fs.existsSync(rncoreAbsolutePath) &&
    fs.readdirSync(rncoreAbsolutePath).length > 0
  );
}

function generateCode(outputPath, schemaInfo, includesGeneratedCode, platform) {
  if (shouldSkipGenerationForRncore(schemaInfo, platform)) {
    console.log(
      '[Codegen - rncore] Skipping iOS code generation for rncore as it has been generated already.',
    );
    return;
  }

  const libraryName = schemaInfo.library.config.name;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), libraryName));
  const tmpOutputDir = path.join(tmpDir, 'out');
  fs.mkdirSync(tmpOutputDir, {recursive: true});

  console.log(
    `[Codegen] Generating Native Code for ${libraryName} - ${platform}`,
  );
  const useLocalIncludePaths = includesGeneratedCode;
  generateSpecsCLIExecutor.generateSpecFromInMemorySchema(
    platform,
    schemaInfo.schema,
    tmpOutputDir,
    libraryName,
    'com.facebook.fbreact.specs',
    schemaInfo.library.config.type,
    useLocalIncludePaths,
  );

  // Finally, copy artifacts to the final output directory.
  const outputDir =
    reactNativeCoreLibraryOutputPath(libraryName, platform) ?? outputPath;
  fs.mkdirSync(outputDir, {recursive: true});
  fs.cpSync(tmpOutputDir, outputDir, {recursive: true});
  console.log(`[Codegen] Generated artifacts: ${outputDir}`);
}

function generateSchemaInfos(libraries) {
  return libraries.map(generateSchemaInfo);
}

function generateNativeCode(
  outputPath,
  schemaInfos,
  includesGeneratedCode,
  platform,
) {
  return schemaInfos.map(schemaInfo => {
    generateCode(outputPath, schemaInfo, includesGeneratedCode, platform);
  });
}

function rootCodegenTargetNeedsThirdPartyComponentProvider(pkgJson, platform) {
  return !pkgJsonIncludesGeneratedCode(pkgJson) && platform === 'ios';
}

function dependencyNeedsThirdPartyComponentProvider(schemaInfo, platform) {
  // Filter the react native core library out.
  // In the future, core library and third party library should
  // use the same way to generate/register the fabric components.
  return !isReactNativeCoreLibrary(schemaInfo.library.config.name, platform);
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

function createComponentProvider(schemas, supportedApplePlatforms) {
  console.log('[Codegen] Creating component provider.');
  const outputDir = path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    'React',
    'Fabric',
  );
  mkdirp.sync(outputDir);
  utils.getCodegen().generateFromSchemas(
    {
      schemas: schemas,
      outputDirectory: outputDir,
      supportedApplePlatforms,
    },
    {
      generators: ['providerIOS'],
    },
  );
  console.log(`[Codegen] Generated provider in: ${outputDir}`);
}

function findCodegenEnabledLibraries(pkgJson, projectRoot) {
  const projectLibraries = findProjectRootLibraries(pkgJson, projectRoot);
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    return projectLibraries;
  } else {
    return [
      ...projectLibraries,
      ...findExternalLibraries(pkgJson),
      ...findLibrariesFromReactNativeConfig(projectRoot),
    ];
  }
}

function generateCustomURLHandlers(libraries, outputDir) {
  const customImageURLLoaderClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTImageURLLoader,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const customImageDataDecoderClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTImageDataDecoder,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const customURLHandlerClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTURLRequestHandler,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const template = fs.readFileSync(MODULES_PROTOCOLS_MM_TEMPLATE_PATH, 'utf8');
  const finalMMFile = template
    .replace(/{imageURLLoaderClassNames}/, customImageURLLoaderClasses)
    .replace(/{imageDataDecoderClassNames}/, customImageDataDecoderClasses)
    .replace(/{requestHandlersClassNames}/, customURLHandlerClasses);

  fs.writeFileSync(
    path.join(outputDir, 'RCTModulesConformingToProtocolsProvider.mm'),
    finalMMFile,
  );

  const templateH = fs.readFileSync(MODULES_PROTOCOLS_H_TEMPLATE_PATH, 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'RCTModulesConformingToProtocolsProvider.h'),
    templateH,
  );
}

// It removes all the empty files and empty folders
// it finds, starting from `filepath`, recursively.
//
// This function is needed since, after aligning the codegen between
// iOS and Android, we have to create empty folders in advance and
// we don't know whether they will be populated up until the end of the process.
//
// @parameter filepath: the root path from which we want to remove the empty files and folders.
function cleanupEmptyFilesAndFolders(filepath) {
  const stats = fs.statSync(filepath);

  if (stats.isFile() && stats.size === 0) {
    fs.rmSync(filepath);
    return;
  } else if (stats.isFile()) {
    return;
  }

  const dirContent = fs.readdirSync(filepath);
  dirContent.forEach(contentPath =>
    cleanupEmptyFilesAndFolders(path.join(filepath, contentPath)),
  );

  // The original folder may be filled with empty folders
  // if that the case, we would also like to remove the parent.
  // Hence, we need to read the folder again.
  const newContent = fs.readdirSync(filepath);
  if (newContent.length === 0) {
    fs.rmdirSync(filepath);
    return;
  }
}

function generateRNCoreComponentsIOS(projectRoot /*: string */) /*: void*/ {
  const ios = 'ios';
  buildCodegenIfNeeded();
  const pkgJson = readPkgJsonInDirectory(projectRoot);
  const rncoreLib = findProjectRootLibraries(pkgJson, projectRoot).filter(
    library => library.config.name === 'rncore',
  )[0];
  if (!rncoreLib) {
    throw new Error(
      "[Codegen] Can't find rncore library. Failed to generate rncore artifacts",
    );
  }
  const rncoreSchemaInfo = generateSchemaInfo(rncoreLib, ios);
  generateCode('', rncoreSchemaInfo, false, ios);
}

// Execute

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
 * @throws If it can't find a config file for react-native.
 * @throws If it can't find a CodeGen configuration in the file.
 * @throws If it can't find a cli for the CodeGen.
 */
function execute(projectRoot, targetPlatform, baseOutputPath) {
  try {
    console.log(
      `[Codegen] Analyzing ${path.join(projectRoot, 'package.json')}`,
    );

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

    buildCodegenIfNeeded();

    const libraries = findCodegenEnabledLibraries(pkgJson, projectRoot);

    if (libraries.length === 0) {
      console.log('[Codegen] No codegen-enabled libraries found.');
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

      const schemaInfos = generateSchemaInfos(libraries);
      generateNativeCode(
        outputPath,
        schemaInfos.filter(schemaInfo =>
          mustGenerateNativeCode(projectRoot, schemaInfo),
        ),
        pkgJsonIncludesGeneratedCode(pkgJson),
        platform,
      );

      if (
        rootCodegenTargetNeedsThirdPartyComponentProvider(pkgJson, platform)
      ) {
        const filteredSchemas = schemaInfos.filter(
          dependencyNeedsThirdPartyComponentProvider,
        );
        const schemas = filteredSchemas.map(schemaInfo => schemaInfo.schema);
        const supportedApplePlatforms = filteredSchemas.map(
          schemaInfo => schemaInfo.supportedApplePlatforms,
        );

        createComponentProvider(schemas, supportedApplePlatforms);
        generateCustomURLHandlers(libraries, outputPath);
      }

      cleanupEmptyFilesAndFolders(outputPath);
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }

  console.log('[Codegen] Done.');
  return;
}

module.exports = {
  execute,
  generateRNCoreComponentsIOS,
  // exported for testing purposes only:
  _extractLibrariesFromJSON: extractLibrariesFromJSON,
  _cleanupEmptyFilesAndFolders: cleanupEmptyFilesAndFolders,
  _extractSupportedApplePlatforms: extractSupportedApplePlatforms,
};
