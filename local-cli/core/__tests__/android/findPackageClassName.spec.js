/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

jest.autoMockOff();

const mockFS = require('mock-fs');

const findPackageClassName = require('../../android/findPackageClassName');
const mocks = require('../../__fixtures__/android');

describe('android::findPackageClassName', () => {
  beforeAll(() => {
    mockFS({
      empty: {},
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns manifest content if file exists in the folder', () => {
    expect(typeof findPackageClassName('flat')).toBe('string');
  });

  it('returns `null` if there are no matches', () => {
    expect(findPackageClassName('empty')).toBeNull();
  });

  afterAll(() => {
    mockFS.restore();
  });
});
