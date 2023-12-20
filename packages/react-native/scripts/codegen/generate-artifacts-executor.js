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
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..', '..');
const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
  rncore: path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, 'ReactCommon'),
  FBReactNativeSpec: null,
};
const REACT_NATIVE = 'react-native';

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

function findExternalLibraries(pkgJson) {
  const dependencies = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies,
  };
  // Determine which of these are codegen-enabled libraries
  console.log(
    '\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in the project dependencies.',
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

function findProjectRootLibraries(pkgJson, projectRoot) {
  console.log(
    '\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in the app',
  );

  if (pkgJson.codegenConfig == null) {
    console.log(
      '[Codegen] The "codegenConfig" field is not defined in package.json. Assuming there is nothing to generate at the app level.',
    );
    return [];
  }

  if (typeof pkgJson.codegenConfig !== 'object') {
    throw '[Codegen] "codegenConfig" field must be an Object.';
  }

  return extractLibrariesFromJSON(pkgJson, projectRoot);
}

function computeOutputPath(projectRoot, baseOutputPath, pkgJson) {
  if (baseOutputPath == null) {
    const baseOutputPathOverride = pkgJson.codegenConfig.outputDir;
    if (baseOutputPathOverride && typeof baseOutputPathOverride === 'string') {
      baseOutputPath = baseOutputPathOverride;
    } else {
      baseOutputPath = projectRoot;
    }
  }
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    // Don't create nested directories for libraries to make importing generated headers easier.
    return baseOutputPath;
  } else {
    return path.join(baseOutputPath, 'build', 'generated', 'ios');
  }
}

function generateSchemaInfo(library) {
  const pathToJavaScriptSources = path.join(
    library.libraryPath,
    library.config.jsSrcsDir,
  );
  console.log(`\n\n[Codegen] >>>>> Processing ${library.config.name}`);
  // Generate one schema for the entire library...
  return {
    library: library,
    schema: utils
      .getCombineJSToSchema()
      .combineSchemasInFileList(
        [pathToJavaScriptSources],
        'ios',
        /NativeSampleTurboModule/,
      ),
  };
}

function generateCode(iosOutputDir, schemaInfo) {
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), schemaInfo.library.config.name),
  );
  const tmpOutputDir = path.join(tmpDir, 'out');
  fs.mkdirSync(tmpOutputDir, {recursive: true});

  generateSpecsCLIExecutor.generateSpecFromInMemorySchema(
    'ios',
    schemaInfo.schema,
    tmpOutputDir,
    schemaInfo.library.config.name,
    'com.facebook.fbreact.specs',
    schemaInfo.library.config.type,
  );

  // Finally, copy artifacts to the final output directory.
  const outputDir =
    CORE_LIBRARIES_WITH_OUTPUT_FOLDER[schemaInfo.library.config.name] ??
    iosOutputDir;
  fs.mkdirSync(outputDir, {recursive: true});
  // TODO: Fix this. This will not work on Windows.
  execSync(`cp -R ${tmpOutputDir}/* "${outputDir}"`);
  console.log(`[Codegen] Generated artifacts: ${outputDir}`);
}

function generateSchemaInfos(libraries) {
  return libraries.map(generateSchemaInfo);
}

function generateNativeCode(iosOutputDir, schemaInfos) {
  return schemaInfos.map(schemaInfo => {
    generateCode(iosOutputDir, schemaInfo);
  });
}

function needsThirdPartyComponentProvider(schemaInfo) {
  // Filter the react native core library out.
  // In the future, core library and third party library should
  // use the same way to generate/register the fabric components.
  return !isReactNativeCoreLibrary(schemaInfo.library.config.name);
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

function createComponentProvider(schemas) {
  console.log('\n\n>>>>> Creating component provider');
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
    },
    {
      generators: ['providerIOS'],
    },
  );
  console.log(`Generated provider in: ${outputDir}`);
}

function findCodegenEnabledLibraries(pkgJson, projectRoot) {
  const projectLibraries = findProjectRootLibraries(pkgJson, projectRoot);
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    return projectLibraries;
  } else {
    return [...projectLibraries, ...findExternalLibraries(pkgJson)];
  }
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
 * @throws If it can't find a config file for react-native.
 * @throws If it can't find a CodeGen configuration in the file.
 * @throws If it can't find a cli for the CodeGen.
 */
function execute(projectRoot, baseOutputPath) {
  try {
    console.log(
      `[Codegen] Analyzing ${path.join(projectRoot, 'package.json')}`,
    );

    const pkgJson = readPkgJsonInDirectory(projectRoot);
    const libraries = findCodegenEnabledLibraries(pkgJson, projectRoot);

    if (libraries.length === 0) {
      console.log('[Codegen] No codegen-enabled libraries found.');
      return;
    }

    const outputPath = computeOutputPath(projectRoot, baseOutputPath, pkgJson);

    const schemaInfos = generateSchemaInfos(libraries);
    generateNativeCode(
      outputPath,
      schemaInfos.filter(schemaInfo =>
        mustGenerateNativeCode(projectRoot, schemaInfo),
      ),
    );

    if (!pkgJsonIncludesGeneratedCode(pkgJson)) {
      const schemas = schemaInfos
        .filter(needsThirdPartyComponentProvider)
        .map(schemaInfo => schemaInfo.schema);
      createComponentProvider(schemas);
    }
    cleanupEmptyFilesAndFolders(outputPath);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }

  console.log('\n\n[Codegen] Done.');
  return;
}

module.exports = {
  execute: execute,
  // exported for testing purposes only:
  _extractLibrariesFromJSON: extractLibrariesFromJSON,
  _cleanupEmptyFilesAndFolders: cleanupEmptyFilesAndFolders,
};
