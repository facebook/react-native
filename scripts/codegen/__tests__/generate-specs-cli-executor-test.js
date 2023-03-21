/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const sut = require('../generate-specs-cli-executor');
const fixtures = require('../__test_fixtures__/fixtures');
const {normalize} = require('path');

describe('generateSpec', () => {
  it('invokes RNCodegen with the right params', () => {
    const platform = 'ios';
    const libraryType = 'all';
    const schemaPath = './';
    const componentsOutputDir = normalize(
      'app/ios/build/generated/ios/react/renderer/components/library',
    );
    const modulesOutputDir = normalize('app/ios/build/generated/ios/library');
    const outputDirectory = normalize('app/ios/build/generated/ios');
    const libraryName = 'library';
    const packageName = 'com.library';
    const generators = ['componentsIOS', 'modulesIOS'];

    jest.mock('fs', () => ({
      readFileSync: (path, encoding) => {
        expect(path).toBe(schemaPath);
        expect(encoding).toBe('utf-8');
        return fixtures.schemaText;
      },
    }));

    let mkdirpSyncInvoked = 0;
    jest.mock('mkdirp', () => ({
      sync: folder => {
        if (mkdirpSyncInvoked === 0) {
          expect(folder).toBe(outputDirectory);
        }

        if (mkdirpSyncInvoked === 1) {
          expect(folder).toBe(componentsOutputDir);
        }

        if (mkdirpSyncInvoked === 2) {
          expect(folder).toBe(modulesOutputDir);
        }

        mkdirpSyncInvoked += 1;
      },
    }));

    // We cannot mock directly the `RNCodegen` object because the
    // code access the `lib` folder directly and request a file explicitly.
    // This makes testing harder than usually. To overcome this, we created a utility
    // to retrieve the `Codegen`. By doing that, we can mock the wrapper so that it returns
    // an object with the same interface of the `RNCodegen` object.
    jest.mock('../codegen-utils', () => ({
      getCodegen: () => ({
        generate: (libraryConfig, generatorConfigs) => {
          expect(libraryConfig.libraryName).toBe(libraryName);
          expect(libraryConfig.schema).toStrictEqual(fixtures.schema);
          expect(libraryConfig.outputDirectory).toBe(outputDirectory);
          expect(libraryConfig.packageName).toBe(packageName);

          expect(generatorConfigs.generators).toStrictEqual(generators);
          expect(generatorConfigs.test).toBeUndefined();
        },
      }),
    }));

    sut.execute(
      platform,
      schemaPath,
      outputDirectory,
      libraryName,
      packageName,
      libraryType,
    );

    expect(mkdirpSyncInvoked).toBe(3);
  });
});
