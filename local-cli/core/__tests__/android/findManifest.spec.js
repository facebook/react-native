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

const findManifest = require('../../android/findManifest');
const fs = require('fs');
const mocks = require('../../__fixtures__/android');

describe('android::findManifest', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        android: mocks.valid,
      },
    });
  });

  it('returns a manifest path if file exists in the folder', () => {
    expect(typeof findManifest('/flat')).toBe('string');
  });

  it('returns `null` if there is no manifest in the folder', () => {
    expect(findManifest('/empty')).toBeNull();
  });
});
