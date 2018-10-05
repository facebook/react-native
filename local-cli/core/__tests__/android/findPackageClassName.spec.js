/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('path');
jest.mock('fs');

const mocks = require('../../__fixtures__/android');
const findPackageClassName = require('../../android/findPackageClassName');
const fs = require('fs');

['posix', 'win32'].forEach(platform => {
  let root;
  describe(`android::findPackageClassName (${platform})`, () => {
    beforeAll(() => {
      root = fs.__setMockFilesystem(
        {
          empty: {},
          flatJava: {
            android: mocks.valid,
          },
          flatKotlin: {
            android: mocks.validKotlin,
          },
        },
        platform,
      );
    });

    it('returns manifest content if file exists in the folder', () => {
      expect(typeof findPackageClassName(root + 'flatJava')).toBe('string');
    });

    it('returns the name of the java class implementing ReactPackage', () => {
      expect(findPackageClassName(root + 'flatJava')).toBe(
        'SomeExampleJavaPackage',
      );
    });

    it('returns the name of the kotlin class implementing ReactPackage', () => {
      expect(findPackageClassName(root + 'flatKotlin')).toBe(
        'SomeExampleKotlinPackage',
      );
    });

    it('returns `null` if there are no matches', () => {
      expect(findPackageClassName(root + 'empty')).toBeNull();
    });
  });
});
