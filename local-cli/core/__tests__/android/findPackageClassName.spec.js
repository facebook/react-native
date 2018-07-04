/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('fs');

const findPackageClassName = require('../../android/findPackageClassName');
const fs = require('fs');
const mocks = require('../../__fixtures__/android');

describe('android::findPackageClassName', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flatJava: {
        android: mocks.valid,
      },
      flatKotlin: {
        android: mocks.validKotlin,
      },
    });
  });

  it('returns manifest content if file exists in the folder', () => {
    expect(typeof findPackageClassName('/flatJava')).toBe('string');
  });

  it('returns the name of the java class implementing ReactPackage', () => {
    expect(findPackageClassName('/flatJava')).toBe('SomeExampleJavaPackage');
  });

  it('returns the name of the kotlin class implementing ReactPackage', () => {
    expect(findPackageClassName('/flatKotlin')).toBe(
      'SomeExampleKotlinPackage',
    );
  });

  it('returns `null` if there are no matches', () => {
    expect(findPackageClassName('/empty')).toBeNull();
  });
});
