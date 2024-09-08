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

const fixtures = require('../__test_fixtures__/fixtures');
const sut = require('../generate-specs-cli-executor');
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
    const generators = ['componentsIOS', 'modulesIOS', 'modulesCxx'];

    jest.mock('fs', () => ({
      readFileSync: (path, encoding) => {
        expect(path).toBe(schemaPath);
        expect(encoding).toBe('utf-8');
        return fixtures.schemaText;
      },
      mkdirSync: jest.fn((folder, options) => {
        if (folder === outputDirectory) {
          expect(options).toEqual({ recursive: true });
        }

        if (folder === componentsOutputDir) {
          expect(options).toEqual({ recursive: true });
        }

        if (folder === modulesOutputDir) {
          expect(options).toEqual({ recursive: true });
        }
      }),
      readdirSync: jest.fn().mockReturnValue([]),
      renameSync: jest.fn(),
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
  });
});
