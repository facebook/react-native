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
const path = require('path');

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

    const tmpComponentOutDirs = path.join(tmpDir, 'out', 'components');
    const tmpNativeModulesOutDir = path.join(tmpDir, 'out', 'nativeModules');
    const iOSComponentOutDirs = path.join(
      iosOutputDir,
      'react/renderer/components',
      library.config.name,
    );
    const iOSNativeModulesOutDir = path.join(
      iosOutputDir,
      './',
      library.config.name,
    );

    // mock used functions
    let mkdirSyncInvocationCount = 0;
    jest.mock('fs', () => ({
      readdirSync: dirpath => {
        return ['test/dir']; //we only require to return something, so that the folder is not empty.
      },
      mkdirSync: (location, config) => {
        if (mkdirSyncInvocationCount === 0) {
          expect(location).toEqual(tmpComponentOutDirs);
        }
        if (mkdirSyncInvocationCount === 1) {
          expect(location).toEqual(tmpNativeModulesOutDir);
        }
        if (mkdirSyncInvocationCount === 2) {
          expect(location).toEqual(iOSComponentOutDirs);
        }
        if (mkdirSyncInvocationCount === 3) {
          expect(location).toEqual(iOSNativeModulesOutDir);
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
        --outputDir ${tmpNativeModulesOutDir} \
        --componentsOutputDir ${tmpComponentOutDirs} \
        --modulesOutputDirs ${tmpNativeModulesOutDir} \
        --libraryName ${library.config.name} \
        --libraryType ${libraryType}`;
          expect(command).toEqual(expectedCommand);
        }

        if (execSyncInvocationCount === 1) {
          expect(command).toEqual(
            `cp -R ${tmpComponentOutDirs}/* ${iOSComponentOutDirs}`,
          );
        }
        if (execSyncInvocationCount === 2) {
          expect(command).toEqual(
            `cp -R ${tmpNativeModulesOutDir}/* ${iOSNativeModulesOutDir}`,
          );
        }

        execSyncInvocationCount += 1;
      },
    }));

    underTest._generateCode(iosOutputDir, library, tmpDir, node, pathToSchema);
    expect(mkdirSyncInvocationCount).toBe(4);
  });
});
