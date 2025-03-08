/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {REACT_NATIVE} = require('./constants');
const {codegenLog, pkgJsonIncludesGeneratedCode} = require('./utils');
const fs = require('fs');
const path = require('path');

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

module.exports = {
  findCodegenEnabledLibraries,
  findProjectRootLibraries,
  extractLibrariesFromJSON,
};
