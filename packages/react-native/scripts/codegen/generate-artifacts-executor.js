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
 * To enable codegen support, the library should include a config in the codegenConfigKey key
 * in a codegenConfigFilename file.
 */

const {execSync, execFileSync} = require('child_process');
const fs = require('fs');
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

const CODEGEN_DEPENDENCY_NAME = '@react-native/codegen';
const CODEGEN_REPO_PATH = `${REACT_NATIVE_REPOSITORY_ROOT}/packages/react-native-codegen`;
const CODEGEN_NPM_PATH = `${REACT_NATIVE_PACKAGE_ROOT_FOLDER}/../${CODEGEN_DEPENDENCY_NAME}`;
const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
  rncore: path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, 'ReactCommon'),
  FBReactNativeSpec: null,
};
const REACT_NATIVE_DEPENDENCY_NAME = 'react-native';

// HELPERS

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

function executeNodeScript(node, scriptArgs) {
  execFileSync(node, scriptArgs);
}

function isAppRootValid(appRootDir) {
  if (appRootDir == null) {
    console.error('Missing path to React Native application');
    process.exitCode = 1;
    return false;
  }
  return true;
}

function readPackageJSON(appRootDir) {
  return JSON.parse(fs.readFileSync(path.join(appRootDir, 'package.json')));
}

function printDeprecationWarningIfNeeded(dependency) {
  if (dependency === REACT_NATIVE_DEPENDENCY_NAME) {
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
function extractLibrariesFromConfigurationArray(
  configFile,
  codegenConfigKey,
  libraries,
  dependency,
  dependencyPath,
) {
  console.log(`[Codegen] Found ${dependency}`);
  configFile[codegenConfigKey].libraries.forEach(config => {
    const libraryConfig = {
      library: dependency,
      config,
      libraryPath: dependencyPath,
    };
    libraries.push(libraryConfig);
  });
}

function extractLibrariesFromJSON(
  configFile,
  libraries,
  codegenConfigKey,
  dependency,
  dependencyPath,
) {
  var isBlocking = false;
  if (dependency == null) {
    dependency = REACT_NATIVE_DEPENDENCY_NAME;
    dependencyPath = REACT_NATIVE_PACKAGE_ROOT_FOLDER;
    // If we are exploring the ReactNative libraries, we want to raise an error
    // if the codegen is not properly configured.
    isBlocking = true;
  }

  if (configFile[codegenConfigKey] == null) {
    if (isBlocking) {
      throw `[Codegen] Error: Could not find codegen config for ${dependency} .`;
    }
    return;
  }

  if (configFile[codegenConfigKey].libraries == null) {
    console.log(`[Codegen] Found ${dependency}`);
    var config = configFile[codegenConfigKey];
    libraries.push({
      library: dependency,
      config,
      libraryPath: dependencyPath,
    });
  } else {
    printDeprecationWarningIfNeeded(dependency);
    extractLibrariesFromConfigurationArray(
      configFile,
      codegenConfigKey,
      libraries,
      dependency,
      dependencyPath,
    );
  }
}

function handleReactNativeCodeLibraries(
  libraries,
  codegenConfigFilename,
  codegenConfigKey,
) {
  // Handle react-native core libraries.
  // This is required when react-native is outside of node_modules.
  console.log('[Codegen] Processing react-native core libraries');
  const reactNativePkgJson = path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    codegenConfigFilename,
  );
  if (!fs.existsSync(reactNativePkgJson)) {
    throw '[Codegen] Error: Could not find config file for react-native.';
  }
  const reactNativeConfigFile = JSON.parse(fs.readFileSync(reactNativePkgJson));
  extractLibrariesFromJSON(reactNativeConfigFile, libraries, codegenConfigKey);
}

function handleThirdPartyLibraries(
  libraries,
  baseCodegenConfigFileDir,
  dependencies,
  codegenConfigFilename,
  codegenConfigKey,
) {
  // Determine which of these are codegen-enabled libraries
  const configDir =
    baseCodegenConfigFileDir ||
    path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, '..');
  console.log(
    `\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in ${configDir}`,
  );

  // Handle third-party libraries
  Object.keys(dependencies).forEach(dependency => {
    if (dependency === REACT_NATIVE_DEPENDENCY_NAME) {
      // react-native should already be added.
      return;
    }
    const codegenConfigFileDir = path.join(configDir, dependency);
    const configFilePath = path.join(
      codegenConfigFileDir,
      codegenConfigFilename,
    );
    if (fs.existsSync(configFilePath)) {
      const configFile = JSON.parse(fs.readFileSync(configFilePath));
      extractLibrariesFromJSON(
        configFile,
        libraries,
        codegenConfigKey,
        dependency,
        codegenConfigFileDir,
      );
    }
  });
}

function handleLibrariesFromReactNativeConfig(
  libraries,
  codegenConfigKey,
  codegenConfigFilename,
  appRootDir,
) {
  const rnConfigFileName = 'react-native.config.js';

  console.log(
    `\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in ${rnConfigFileName}`,
  );

  const rnConfigFilePath = path.resolve(appRootDir, rnConfigFileName);

  if (fs.existsSync(rnConfigFilePath)) {
    const rnConfig = require(rnConfigFilePath);

    if (rnConfig.dependencies != null) {
      Object.keys(rnConfig.dependencies).forEach(name => {
        const dependencyConfig = rnConfig.dependencies[name];

        if (dependencyConfig.root) {
          const codegenConfigFileDir = path.resolve(
            appRootDir,
            dependencyConfig.root,
          );
          const configFilePath = path.join(
            codegenConfigFileDir,
            codegenConfigFilename,
          );
          const pkgJsonPath = path.join(codegenConfigFileDir, 'package.json');

          if (fs.existsSync(configFilePath)) {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath));
            const configFile = JSON.parse(fs.readFileSync(configFilePath));
            extractLibrariesFromJSON(
              configFile,
              libraries,
              codegenConfigKey,
              pkgJson.name,
              codegenConfigFileDir,
            );
          }
        }
      });
    }
  }
}

function handleInAppLibraries(
  libraries,
  pkgJson,
  codegenConfigKey,
  appRootDir,
) {
  console.log(
    '\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in the app',
  );

  extractLibrariesFromJSON(
    pkgJson,
    libraries,
    codegenConfigKey,
    pkgJson.name,
    appRootDir,
  );
}

// CodeGen
function getCodeGenCliPath() {
  let codegenCliPath;
  if (fs.existsSync(CODEGEN_REPO_PATH)) {
    codegenCliPath = CODEGEN_REPO_PATH;

    if (!fs.existsSync(path.join(CODEGEN_REPO_PATH, 'lib'))) {
      console.log('\n\n[Codegen] >>>>> Building react-native-codegen package');
      execSync('yarn install', {
        cwd: codegenCliPath,
        stdio: 'inherit',
      });
      execSync('yarn build', {
        cwd: codegenCliPath,
        stdio: 'inherit',
      });
    }
  } else if (fs.existsSync(CODEGEN_NPM_PATH)) {
    codegenCliPath = CODEGEN_NPM_PATH;
  } else {
    throw `error: Could not determine ${CODEGEN_DEPENDENCY_NAME} location. Try running 'yarn install' or 'npm install' in your project root.`;
  }
  return codegenCliPath;
}

function computeIOSOutputDir(outputPath, appRootDir) {
  return path.join(outputPath ? outputPath : appRootDir, 'build/generated/ios');
}

function generateSchema(tmpDir, library, node, codegenCliPath) {
  const pathToSchema = path.join(tmpDir, 'schema.json');
  const pathToJavaScriptSources = path.join(
    library.libraryPath,
    library.config.jsSrcsDir,
  );

  console.log(`\n\n[Codegen] >>>>> Processing ${library.config.name}`);
  // Generate one schema for the entire library...
  executeNodeScript(node, [
    `${path.join(
      codegenCliPath,
      'lib',
      'cli',
      'combine',
      'combine-js-to-schema-cli.js',
    )}`,
    '--platform',
    'ios',
    pathToSchema,
    pathToJavaScriptSources,
  ]);
  console.log(`[Codegen] Generated schema: ${pathToSchema}`);
  return pathToSchema;
}

function generateCode(iosOutputDir, library, tmpDir, node, pathToSchema) {
  // ...then generate native code artifacts.
  const libraryTypeArg = library.config.type ? `${library.config.type}` : '';

  const tmpOutputDir = path.join(tmpDir, 'out');
  fs.mkdirSync(tmpOutputDir, {recursive: true});

  executeNodeScript(node, [
    `${path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'scripts',
      'generate-specs-cli.js',
    )}`,
    '--platform',
    'ios',
    '--schemaPath',
    pathToSchema,
    '--outputDir',
    tmpOutputDir,
    '--libraryName',
    library.config.name,
    '--libraryType',
    libraryTypeArg,
  ]);

  // Finally, copy artifacts to the final output directory.
  const outputDir =
    CORE_LIBRARIES_WITH_OUTPUT_FOLDER[library.config.name] ?? iosOutputDir;
  fs.mkdirSync(outputDir, {recursive: true});
  execSync(`cp -R ${tmpOutputDir}/* "${outputDir}"`);
  console.log(`[Codegen] Generated artifacts: ${iosOutputDir}`);
}

function generateNativeCodegenFiles(
  libraries,
  fabricEnabled,
  iosOutputDir,
  node,
  codegenCliPath,
  schemaPaths,
) {
  let fabricEnabledTypes = ['components', 'all'];
  libraries.forEach(library => {
    if (
      !fabricEnabled &&
      fabricEnabledTypes.indexOf(library.config.type) >= 0
    ) {
      console.log(
        `[Codegen] ${library.config.name} skipped because fabric is not enabled.`,
      );
      return;
    }
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), library.config.name));
    const pathToSchema = generateSchema(tmpDir, library, node, codegenCliPath);
    generateCode(iosOutputDir, library, tmpDir, node, pathToSchema);

    // Filter the react native core library out.
    // In the future, core library and third party library should
    // use the same way to generate/register the fabric components.
    if (!isReactNativeCoreLibrary(library.config.name)) {
      schemaPaths[library.config.name] = pathToSchema;
    }
  });
}

function createComponentProvider(
  fabricEnabled,
  schemaPaths,
  node,
  iosOutputDir,
) {
  if (fabricEnabled) {
    console.log('\n\n>>>>> Creating component provider');
    // Save the list of spec paths to a temp file.
    const schemaListTmpPath = `${os.tmpdir()}/rn-tmp-schema-list.json`;
    const fd = fs.openSync(schemaListTmpPath, 'w');
    fs.writeSync(fd, JSON.stringify(schemaPaths));
    fs.closeSync(fd);
    console.log(`Generated schema list: ${schemaListTmpPath}`);

    const outputDir = path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'React',
      'Fabric',
    );

    // Generate FabricComponentProvider.
    // Only for iOS at this moment.
    executeNodeScript(node, [
      `${path.join(
        REACT_NATIVE_PACKAGE_ROOT_FOLDER,
        'scripts',
        'generate-provider-cli.js',
      )}`,
      '--platform',
      'ios',
      '--schemaListPath',
      schemaListTmpPath,
      '--outputDir',
      outputDir,
    ]);
    console.log(`Generated provider in: ${outputDir}`);
  }
}

function findCodegenEnabledLibraries(
  appRootDir,
  baseCodegenConfigFileDir,
  codegenConfigFilename,
  codegenConfigKey,
) {
  const pkgJson = readPackageJSON(appRootDir);
  const dependencies = {...pkgJson.dependencies, ...pkgJson.devDependencies};
  const libraries = [];

  handleReactNativeCodeLibraries(
    libraries,
    codegenConfigFilename,
    codegenConfigKey,
  );
  handleThirdPartyLibraries(
    libraries,
    baseCodegenConfigFileDir,
    dependencies,
    codegenConfigFilename,
    codegenConfigKey,
  );
  handleLibrariesFromReactNativeConfig(
    libraries,
    codegenConfigKey,
    codegenConfigFilename,
    appRootDir,
  );
  handleInAppLibraries(libraries, pkgJson, codegenConfigKey, appRootDir);

  return libraries;
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
 * @parameter appRootDir: the directory with the app source code, where the `codegenConfigFilename` lives.
 * @parameter outputPath: the base output path for the CodeGen.
 * @parameter node: the path to the node executable, used to run the codegen scripts.
 * @parameter codegenConfigFilename: the file that contains the codeGen configuration. The default is `package.json`.
 * @parameter codegenConfigKey: the key in the codegenConfigFile that controls the codegen.
 * @parameter baseCodegenConfigFileDir: the directory of the codeGenConfigFile.
 * @parameter fabricEnabled: whether fabric is enabled or not.
 * @throws If it can't find a config file for react-native.
 * @throws If it can't find a CodeGen configuration in the file.
 * @throws If it can't find a cli for the CodeGen.
 */
function execute(
  appRootDir,
  outputPath,
  node,
  codegenConfigFilename,
  codegenConfigKey,
  baseCodegenConfigFileDir,
  fabricEnabled,
) {
  if (!isAppRootValid(appRootDir)) {
    return;
  }

  try {
    const libraries = findCodegenEnabledLibraries(
      appRootDir,
      baseCodegenConfigFileDir,
      codegenConfigFilename,
      codegenConfigKey,
    );

    if (libraries.length === 0) {
      console.log('[Codegen] No codegen-enabled libraries found.');
      return;
    }

    const codegenCliPath = getCodeGenCliPath();

    const schemaPaths = {};

    const iosOutputDir = computeIOSOutputDir(outputPath, appRootDir);

    generateNativeCodegenFiles(
      libraries,
      fabricEnabled,
      iosOutputDir,
      node,
      codegenCliPath,
      schemaPaths,
    );

    createComponentProvider(fabricEnabled, schemaPaths, node, iosOutputDir);
    cleanupEmptyFilesAndFolders(iosOutputDir);
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
  _findCodegenEnabledLibraries: findCodegenEnabledLibraries,
  _executeNodeScript: executeNodeScript,
  _generateCode: generateCode,
  _cleanupEmptyFilesAndFolders: cleanupEmptyFilesAndFolders,
};
