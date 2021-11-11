/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
 * To enable codegen support, the library should include a config in the CODEGEN_CONFIG_KEY key
 * in a CODEGEN_CONFIG_FILENAME file.
 */

const {execSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'path',
    description: 'Path to React Native application',
  })
  .option('o', {
    alias: 'outputPath',
    description: 'Path where generated artifacts will be output to',
  })
  .option('f', {
    alias: 'configFilename',
    default: 'package.json',
    description: 'The file that contains the codegen configuration.',
  })
  .option('k', {
    alias: 'configKey',
    default: 'codegenConfig',
    description:
      'The key that contains the codegen configuration in the config file.',
  })
  .usage('Usage: $0 -p [path to app]')
  .demandOption(['p']).argv;

const RN_ROOT = path.join(__dirname, '..');
const CODEGEN_CONFIG_FILENAME = argv.f;
const CODEGEN_CONFIG_KEY = argv.k;
const CODEGEN_REPO_PATH = `${RN_ROOT}/packages/react-native-codegen`;
const CODEGEN_NPM_PATH = `${RN_ROOT}/../react-native-codegen`;
const CORE_LIBRARIES = new Set(['rncore', 'FBReactNativeSpec']);

function isReactNativeCoreLibrary(libraryName) {
  return CORE_LIBRARIES.has(libraryName);
}

function main(appRootDir, outputPath) {
  if (appRootDir == null) {
    console.error('Missing path to React Native application');
    process.exitCode = 1;
    return;
  }

  try {
    // 1. Get app package.json
    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(appRootDir, 'package.json')),
    );

    // 2. Get dependencies for the app
    const dependencies = {...pkgJson.dependencies, ...pkgJson.devDependencies};

    // 3. Determine which of these are codegen-enabled libraries
    console.log(
      `\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in ${appRootDir}`,
    );
    const libraries = [];

    // Handle react-native and third-party libraries
    Object.keys(dependencies).forEach(dependency => {
      const codegenConfigFileDir = path.join(
        appRootDir,
        'node_modules',
        dependency,
      );
      const configFilePath = path.join(
        codegenConfigFileDir,
        CODEGEN_CONFIG_FILENAME,
      );
      if (fs.existsSync(configFilePath)) {
        const configFile = JSON.parse(fs.readFileSync(configFilePath));
        if (
          configFile[CODEGEN_CONFIG_KEY] != null &&
          configFile[CODEGEN_CONFIG_KEY].libraries != null
        ) {
          console.log(`[Codegen] Found ${dependency}`);
          configFile[CODEGEN_CONFIG_KEY].libraries.forEach(config => {
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

    // Handle in-app libraries
    if (
      pkgJson[CODEGEN_CONFIG_KEY] != null &&
      pkgJson[CODEGEN_CONFIG_KEY].libraries != null
    ) {
      console.log(`[Codegen] Found ${pkgJson.name}`);
      pkgJson[CODEGEN_CONFIG_KEY].libraries.forEach(config => {
        const libraryConfig = {
          library: pkgJson.name,
          config,
          libraryPath: appRootDir,
        };
        libraries.push(libraryConfig);
      });
    }

    if (libraries.length === 0) {
      console.log('[Codegen] No codegen-enabled libraries found.');
      return;
    }

    // 4. Locate codegen package
    let codegenCliPath;
    if (fs.existsSync(CODEGEN_REPO_PATH)) {
      codegenCliPath = CODEGEN_REPO_PATH;

      if (!fs.existsSync(path.join(CODEGEN_REPO_PATH, 'lib'))) {
        console.log(
          '\n\n[Codegen] >>>>> Building react-native-codegen package',
        );
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

    const schemaPaths = {};

    // 5. For each codegen-enabled library, generate the native code spec files
    libraries.forEach(library => {
      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), library.config.name),
      );
      const pathToSchema = path.join(tmpDir, 'schema.json');
      const pathToJavaScriptSources = path.join(
        library.libraryPath,
        library.config.jsSrcsDir,
      );
      const pathToOutputDirIOS = path.join(
        outputPath ? outputPath : appRootDir,
        'build/generated/ios',
        library.config.name,
        'react/renderer/components',
      );
      const pathToTempOutputDir = path.join(tmpDir, 'out');

      console.log(`\n\n[Codegen] >>>>> Processing ${library.config.name}`);
      // Generate one schema for the entire library...
      execSync(
        `node ${path.join(
          codegenCliPath,
          'lib',
          'cli',
          'combine',
          'combine-js-to-schema-cli.js',
        )} ${pathToSchema} ${pathToJavaScriptSources}`,
      );
      console.log(`[Codegen] Generated schema: ${pathToSchema}`);

      // ...then generate native code artifacts.
      const libraryTypeArg = library.config.type
        ? `--libraryType ${library.config.type}`
        : '';
      fs.mkdirSync(pathToTempOutputDir, {recursive: true});
      execSync(
        `node ${path.join(
          RN_ROOT,
          'scripts',
          'generate-specs-cli.js',
        )} --platform ios --schemaPath ${pathToSchema} --outputDir ${pathToTempOutputDir} --libraryName ${
          library.config.name
        } ${libraryTypeArg}`,
      );

      // Finally, copy artifacts to the final output directory.
      fs.mkdirSync(pathToOutputDirIOS, {recursive: true});
      execSync(`cp -R ${pathToTempOutputDir}/* ${pathToOutputDirIOS}`);
      console.log(`[Codegen] Generated artifacts: ${pathToOutputDirIOS}`);

      // Filter the react native core library out.
      // In the future, core library and third party library should
      // use the same way to generate/register the fabric components.
      if (!isReactNativeCoreLibrary(library.config.name)) {
        schemaPaths[library.config.name] = pathToSchema;
      }
    });

    console.log('\n\n>>>>> Creating component provider');
    // Save the list of spec paths to a temp file.
    const schemaListTmpPath = `${os.tmpdir()}/rn-tmp-schema-list.json`;
    const fd = fs.openSync(schemaListTmpPath, 'w');
    fs.writeSync(fd, JSON.stringify(schemaPaths));
    fs.closeSync(fd);
    console.log(`Generated schema list: ${schemaListTmpPath}`);

    // Generate FabricComponentProvider.
    // Only for iOS at this moment.
    const providerOutputPathIOS = path.join(
      appRootDir,
      'build',
      'generated',
      'ios',
    );
    execSync(
      `node ${path.join(
        RN_ROOT,
        'scripts',
        'generate-provider-cli.js',
      )} --platform ios --schemaListPath "${schemaListTmpPath}" --outputDir ${providerOutputPathIOS}`,
    );
    console.log(`Generated provider in: ${providerOutputPathIOS}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }

  // 5. Done!
  console.log('\n\n[Codegen] Done.');
  return;
}

const appRoot = argv.path;
const outputPath = argv.outputPath;
main(appRoot, outputPath);
