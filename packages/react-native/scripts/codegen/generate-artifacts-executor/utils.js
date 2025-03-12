/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';
const {
  CODEGEN_REPO_PATH,
  CORE_LIBRARIES_WITH_OUTPUT_FOLDER,
  REACT_NATIVE,
} = require('./constants');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

function pkgJsonIncludesGeneratedCode(pkgJson) {
  return pkgJson.codegenConfig && pkgJson.codegenConfig.includesGeneratedCode;
}

const codegenLog = (text, info = false) => {
  // ANSI escape codes for colors and formatting
  const reset = '\x1b[0m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const bold = '\x1b[1m';

  const color = info ? yellow : '';
  console.log(`${cyan}${bold}[Codegen]${reset} ${color}${text}${reset}`);
};

function readPkgJsonInDirectory(dir) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw `[Codegen] Error: ${pkgJsonPath} does not exist.`;
  }
  return JSON.parse(fs.readFileSync(pkgJsonPath));
}

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
  codegenLog('Building react-native-codegen package.', true);
  execSync('yarn install', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
  execSync('yarn build', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
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

/**
 * Finding libraries!
 */
function findCodegenEnabledLibraries(pkgJson, projectRoot) {
  const projectLibraries = findProjectRootLibraries(pkgJson, projectRoot);
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    return projectLibraries;
  } else {
    return [
      ...projectLibraries,
      ...findExternalLibraries(pkgJson, projectRoot),
      ...findLibrariesFromReactNativeConfig(projectRoot),
    ];
  }
}

function findProjectRootLibraries(pkgJson, projectRoot) {
  codegenLog('Searching for codegen-enabled libraries in the app.', true);

  if (pkgJson.codegenConfig == null) {
    codegenLog(
      'The "codegenConfig" field is not defined in package.json. Assuming there is nothing to generate at the app level.',
      true,
    );
    return [];
  }

  if (typeof pkgJson.codegenConfig !== 'object') {
    throw 'The "codegenConfig" field must be an Object.';
  }

  return extractLibrariesFromJSON(pkgJson, projectRoot);
}

function findLibrariesFromReactNativeConfig(projectRoot) {
  const rnConfigFileName = 'react-native.config.js';

  codegenLog(
    `Searching for codegen-enabled libraries in ${rnConfigFileName}`,
    true,
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

function findExternalLibraries(pkgJson, projectRoot) {
  const dependencies = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies,
  };
  // Determine which of these are codegen-enabled libraries
  codegenLog(
    'Searching for codegen-enabled libraries in the project dependencies.',
    true,
  );
  // Handle third-party libraries
  return Object.keys(dependencies).flatMap(dependency => {
    let configFilePath = '';
    try {
      configFilePath = require.resolve(path.join(dependency, 'package.json'), {
        paths: [projectRoot],
      });
    } catch (e) {
      // require.resolve fails if the dependency is a local node module.
      if (
        dependencies[dependency].startsWith('.') || // handles relative paths
        dependencies[dependency].startsWith('/') // handles absolute paths
      ) {
        configFilePath = path.join(
          projectRoot,
          pkgJson.dependencies[dependency],
          'package.json',
        );
      } else {
        return [];
      }
    }
    const configFile = JSON.parse(fs.readFileSync(configFilePath));
    const codegenConfigFileDir = path.dirname(configFilePath);
    return extractLibrariesFromJSON(configFile, codegenConfigFileDir);
  });
}

function extractLibrariesFromJSON(configFile, dependencyPath) {
  if (configFile.codegenConfig == null) {
    return [];
  }
  codegenLog(`Found ${configFile.name}`);
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

function printDeprecationWarningIfNeeded(dependency) {
  if (dependency === REACT_NATIVE) {
    return;
  }
  codegenLog(`CodegenConfig Deprecated Setup for ${dependency}.
    The configuration file still contains the codegen in the libraries array.
    If possible, replace it with a single object.
  `);
  codegenLog(`BEFORE:
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

function extractLibrariesFromConfigurationArray(configFile, dependencyPath) {
  return configFile.codegenConfig.libraries.map(config => {
    return {
      config,
      libraryPath: dependencyPath,
    };
  });
}

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

/**
 * Returns a map of this shape:
 * {
 *   "libraryName": {
 *     "library": { ... }
 *     "modules": {
 *       "moduleName": {
 *         "conformsToProtocols": [ "protocol1", "protocol2" ],
 *         "className": "RCTFooModuler",
 *       }
 *     },
 *     "components": {
 *       "componentName": {
 *         "className": "RCTFooComponent",
 *       }
 *     }
 *   }
 * }
 *
 * Validates that modules are defined in at most one library.
 * Validates that components are defined in at most one library.
 */
function parseiOSAnnotations(libraries) {
  const mLibraryMap = {};
  const cLibraryMap = {};
  const map = {};

  for (const library of libraries) {
    const iosConfig = library?.config?.ios;
    if (!iosConfig) {
      continue;
    }

    const libraryName = getLibraryName(library);
    map[libraryName] = map[libraryName] || {
      library,
      modules: {},
      components: {},
    };

    const {modules, components} = iosConfig;
    if (modules) {
      for (const [moduleName, annotation] of Object.entries(modules)) {
        mLibraryMap[moduleName] = mLibraryMap[moduleName] || new Set();
        mLibraryMap[moduleName].add(libraryName);

        map[libraryName].modules[moduleName] = {...annotation};
      }
    }

    if (components) {
      for (const [moduleName, annotation] of Object.entries(components)) {
        cLibraryMap[moduleName] = cLibraryMap[moduleName] || new Set();
        cLibraryMap[moduleName].add(libraryName);

        map[libraryName].components[moduleName] = {...annotation};
      }
    }
  }

  const moduleConflicts = Object.entries(mLibraryMap)
    .filter(([_, libraryNames]) => libraryNames.size > 1)
    .map(([moduleName, libraryNames]) => {
      const libraryNamesString = Array.from(libraryNames).join(', ');
      return `  Module { "${moduleName}" } => Libraries{ ${libraryNamesString} }\n`;
    });

  const componentConflicts = Object.entries(cLibraryMap)
    .filter(([_, libraryNames]) => libraryNames.size > 1)
    .map(([moduleName, libraryNames]) => {
      const libraryNamesString = Array.from(libraryNames).join(', ');
      return `  Component { "${moduleName}" } => Libraries{ ${libraryNamesString} }\n`;
    });

  if (moduleConflicts.length > 0 || componentConflicts.legnth > 0) {
    throw new Error(
      'Some components or modules are declared in more than one libraries: \n' +
        [...moduleConflicts, ...componentConflicts].join('\n'),
    );
  }

  return map;
}

function getLibraryName(library) {
  return JSON.parse(
    fs.readFileSync(path.join(library.libraryPath, 'package.json')),
  ).name;
}

module.exports = {
  buildCodegenIfNeeded,
  pkgJsonIncludesGeneratedCode,
  codegenLog,
  readPkgJsonInDirectory,
  isReactNativeCoreLibrary,
  cleanupEmptyFilesAndFolders,
  findCodegenEnabledLibraries,
  findProjectRootLibraries,
  extractLibrariesFromJSON,
  parseiOSAnnotations,
};
