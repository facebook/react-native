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

const findManifest = require('../../android/findManifest');
const mockFS = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::findManifest', () => {
  beforeAll(() => {
    mockFS({
      empty: {},
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns a manifest path if file exists in the folder', () => {
    expect(typeof findManifest('flat')).toBe('string');
  });

  it('returns `null` if there is no manifest in the folder', () => {
    expect(findManifest('empty')).toBeNull();
  });

  afterAll(() => {
    mockFS.restore();
  });
});
