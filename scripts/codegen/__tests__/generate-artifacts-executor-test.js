/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use strict';

const underTest = require('../generate-artifacts-executor');
const fixtures = require('../__test_fixtures__/fixtures');
const path = require('path');

const codegenConfigKey = 'codegenConfig';
const reactNativeDependencyName = 'react-native';
const rootPath = path.join(__dirname, '../../..');

describe('generateCode', () => {
  it('executeNodes with the right arguents', () => {
    // Define variables and expected values
    const iosOutputDir = 'app/ios/build/generated/ios';
    const library = {config: {name: 'library', type: 'all'}};
    const tmpDir = 'tmp';
    const node = 'usr/bin/node';
    const pathToSchema = 'app/build/schema.json';
    const rnRoot = path.join(__dirname, '../..');
    const libraryType = 'all';

    const tmpOutDir = path.join(tmpDir, 'out');

    // mock used functions
    let mkdirSyncInvocationCount = 0;
    jest.mock('fs', () => ({
      mkdirSync: (location, config) => {
        if (mkdirSyncInvocationCount === 0) {
          expect(location).toEqual(tmpOutDir);
        }
        if (mkdirSyncInvocationCount === 1) {
          expect(location).toEqual(iosOutputDir);
        }

        mkdirSyncInvocationCount += 1;
      },
    }));

    let execSyncInvocationCount = 0;
    jest.mock('child_process', () => ({
      execSync: command => {
        if (execSyncInvocationCount === 0) {
          const expectedCommand = `${node} ${path.join(
            rnRoot,
            'generate-specs-cli.js',
          )} \
        --platform ios \
        --schemaPath ${pathToSchema} \
        --outputDir ${tmpOutDir} \
        --libraryName ${library.config.name} \
        --libraryType ${libraryType}`;
          expect(command).toEqual(expectedCommand);
        }

        if (execSyncInvocationCount === 1) {
          expect(command).toEqual(`cp -R ${tmpOutDir}/* ${iosOutputDir}`);
        }

        execSyncInvocationCount += 1;
      },
    }));

    underTest._generateCode(iosOutputDir, library, tmpDir, node, pathToSchema);
    expect(mkdirSyncInvocationCount).toBe(2);
  });
});

describe('extractLibrariesFromJSON', () => {
  it('throws if in react-native and no dependencies found', () => {
    let libraries = [];
    let configFile = {};
    expect(() => {
      underTest._extractLibrariesFromJSON(
        configFile,
        libraries,
        codegenConfigKey,
      );
    }).toThrow();
  });

  it('it skips if not into react-native and no dependencies found', () => {
    let libraries = [];
    let configFile = {};

    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      'some-node-module',
      'node_modules/some',
    );
    expect(libraries.length).toBe(0);
  });

  it('extracts a single dependency when config has no libraries', () => {
    let libraries = [];
    let configFile = fixtures.noLibrariesConfigFile;
    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      'my-app',
      '.',
    );
    expect(libraries.length).toBe(1);
    expect(libraries[0]).toEqual({
      library: 'my-app',
      config: {
        name: 'AppModules',
        type: 'all',
        jsSrcsDir: '.',
      },
      libraryPath: '.',
    });
  });

  it("extract codegenConfig when it's empty", () => {
    const configFile = {codegenConfig: {libraries: []}};
    let libraries = [];
    underTest._extractLibrariesFromJSON(
      configFile,
      codegenConfigKey,
      libraries,
      reactNativeDependencyName,
      rootPath,
    );
    expect(libraries.length).toBe(0);
  });

  it('extract codegenConfig when dependency is one', () => {
    const configFile = fixtures.singleLibraryCodegenConfig;
    let libraries = [];
    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      reactNativeDependencyName,
      rootPath,
    );
    expect(libraries.length).toBe(1);
    expect(libraries[0]).toEqual({
      library: reactNativeDependencyName,
      config: {
        name: 'react-native',
        type: 'all',
        jsSrcsDir: '.',
      },
      libraryPath: rootPath,
    });
  });

  it('extract codegenConfig with multiple dependencies', () => {
    const configFile = fixtures.multipleLibrariesCodegenConfig;
    const myDependency = 'my-dependency';
    const myDependencyPath = path.join(__dirname, myDependency);
    let libraries = [];
    underTest._extractLibrariesFromJSON(
      configFile,
      libraries,
      codegenConfigKey,
      myDependency,
      myDependencyPath,
    );
    expect(libraries.length).toBe(3);
    expect(libraries[0]).toEqual({
      library: myDependency,
      config: {
        name: 'react-native',
        type: 'all',
        jsSrcsDir: '.',
      },
      libraryPath: myDependencyPath,
    });
    expect(libraries[1]).toEqual({
      library: myDependency,
      config: {
        name: 'my-component',
        type: 'components',
        jsSrcsDir: 'component/js',
      },
      libraryPath: myDependencyPath,
    });
    expect(libraries[2]).toEqual({
      library: myDependency,
      config: {
        name: 'my-module',
        type: 'module',
        jsSrcsDir: 'module/js',
      },
      libraryPath: myDependencyPath,
    });
  });
});
