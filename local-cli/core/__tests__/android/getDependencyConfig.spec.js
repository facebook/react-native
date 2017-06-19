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

const getDependencyConfig = require('../../android').dependencyConfig;
const mockFS = require('mock-fs');
const mocks = require('../../__fixtures__/android');

const userConfig = {};

describe('android::getDependencyConfig', () => {
  beforeAll(() => {
    mockFS({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
      corrupted: {
        android: {
          app: mocks.corrupted,
        },
      },
      noPackage: {
        android: {},
      },
    });
  });

  it('returns an object with android project configuration', () => {
    expect(getDependencyConfig('nested', userConfig)).not.toBeNull();
    expect(typeof getDependencyConfig('nested', userConfig)).toBe('object');
  });

  it('returns `null` if manifest file has not been found', () => {
    expect(getDependencyConfig('empty', userConfig)).toBeNull();
  });

  it('returns `null` if android project was not found', () => {
    expect(getDependencyConfig('empty', userConfig)).toBeNull();
  });

  it('returns `null` if android project does not contain ReactPackage', () => {
    expect(getDependencyConfig('noPackage', userConfig)).toBeNull();
  });

  it('returns `null` if it cannot find a packageClassName', () => {
    expect(getDependencyConfig('corrupted', userConfig)).toBeNull();
  });

  afterAll(() => {
    mockFS.restore();
  });
});
