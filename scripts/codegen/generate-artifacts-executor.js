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

const {execSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RN_ROOT = path.join(__dirname, '../..');

const CODEGEN_REPO_PATH = `${RN_ROOT}/packages/react-native-codegen`;
const CODEGEN_NPM_PATH = `${RN_ROOT}/../react-native-codegen`;
const CORE_LIBRARIES = new Set(['rncore', 'FBReactNativeSpec']);
const REACT_NATIVE_DEPENDENCY_NAME = 'react-native';

// HELPERS

function isReactNativeCoreLibrary(libraryName) {
  return CORE_LIBRARIES.has(libraryName);
}

function executeNodeScript(node, script) {
  execSync(`${node} ${script}`);
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

// Reading Libraries

function handleReactNativeCodeLibraries(
  libraries,
  codegenConfigFilename,
  codegenConfigKey,
) {
  // Handle react-native core libraries.
  // This is required when react-native is outside of node_modules.
  console.log('[Codegen] Processing react-native core libraries');
  const reactNativePkgJson = path.join(RN_ROOT, codegenConfigFilename);
  if (!fs.existsSync(reactNativePkgJson)) {
    throw '[Codegen] Error: Could not find config file for react-native.';
  }
  const reactNativeConfigFile = JSON.parse(fs.readFileSync(reactNativePkgJson));
  if (
    reactNativeConfigFile[codegenConfigKey] == null ||
    reactNativeConfigFile[codegenConfigKey].libraries == null
  ) {
    throw '[Codegen] Error: Could not find codegen config for react-native.';
  }
  console.log('[Codegen] Found react-native');
  reactNativeConfigFile[codegenConfigKey].libraries.forEach(config => {
    const libraryConfig = {
      library: REACT_NATIVE_DEPENDENCY_NAME,
      config,
      libraryPath: RN_ROOT,
    };
    libraries.push(libraryConfig);
  });
}

function handleThirdPartyLibraries(
  libraries,
  baseCodegenConfigFileDir,
  dependencies,
  codegenConfigFilename,
  codegenConfigKey,
) {
  // Determine which of these are codegen-enabled libraries
  const configDir = baseCodegenConfigFileDir || path.join(RN_ROOT, '..');
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
      if (
        configFile[codegenConfigKey] != null &&
        configFile[codegenConfigKey].libraries != null
      ) {
        console.log(`[Codegen] Found ${dependency}`);
        configFile[codegenConfigKey].libraries.forEach(config => {
          const libraryConfig = {
            library: dependency,
            config,
            libraryPath: codegenConfigFileDir,
          };
          libraries.push(libraryConfig);
        });
      }
    }
  });
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

  // Handle in-app libraries
  if (
    pkgJson[codegenConfigKey] != null &&
    pkgJson[codegenConfigKey].libraries != null
  ) {
    console.log(`[Codegen] Found ${pkgJson.name}`);
    pkgJson[codegenConfigKey].libraries.forEach(config => {
      const libraryConfig = {
        library: pkgJson.name,
        config,
        libraryPath: appRootDir,
      };
      libraries.push(libraryConfig);
    });
  }
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
    throw "error: Could not determine react-native-codegen location. Try running 'yarn install' or 'npm install' in your project root.";
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
  executeNodeScript(
    node,
    `${path.join(
      codegenCliPath,
      'lib',
      'cli',
      'combine',
      'combine-js-to-schema-cli.js',
    )} ${pathToSchema} ${pathToJavaScriptSources}`,
  );
  console.log(`[Codegen] Generated schema: ${pathToSchema}`);
  return pathToSchema;
}

function generateCode(iosOutputDir, library, tmpDir, node, pathToSchema) {
  // ...then generate native code artifacts.
  const libraryTypeArg = library.config.type
    ? `--libraryType ${library.config.type}`
    : '';

  const tmpOutputDir = path.join(tmpDir, 'out');
  fs.mkdirSync(tmpOutputDir, {recursive: true});

  executeNodeScript(
    node,
    `${path.join(RN_ROOT, 'scripts', 'generate-specs-cli.js')} \
        --platform ios \
        --schemaPath ${pathToSchema} \
        --outputDir ${tmpOutputDir} \
        --libraryName ${library.config.name} \
        ${libraryTypeArg}`,
  );

  // Finally, copy artifacts to the final output directory.
  fs.mkdirSync(iosOutputDir, {recursive: true});
  execSync(`cp -R ${tmpOutputDir}/* ${iosOutputDir}`);
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

    // Generate FabricComponentProvider.
    // Only for iOS at this moment.
    executeNodeScript(
      node,
      `${path.join(
        RN_ROOT,
        'scripts',
        'generate-provider-cli.js',
      )} --platform ios --schemaListPath "${schemaListTmpPath}" --outputDir ${iosOutputDir}`,
    );
    console.log(`Generated provider in: ${iosOutputDir}`);
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
    handleInAppLibraries(libraries, pkgJson, codegenConfigKey, appRootDir);

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
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }

  console.log('\n\n[Codegen] Done.');
  return;
}

module.exports = {
  execute: execute,
  _executeNodeScript: executeNodeScript, // exported for testing purposes only
  _generateCode: generateCode, // exported for testing purposes only
};
