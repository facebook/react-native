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

jest.mock('fs');

const findManifest = require('../../android/findManifest');
const readManifest = require('../../android/readManifest');
const fs = require('fs');
const mocks = require('../../__fixtures__/android');

describe('android::readManifest', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
    });
  });

  it('returns manifest content if file exists in the folder', () => {
    const manifestPath = findManifest('/nested');
    expect(readManifest(manifestPath)).not.toBeNull();
    expect(typeof readManifest(manifestPath)).toBe('object');
  });

  it('throws an error if there is no manifest in the folder', () => {
    const fakeManifestPath = findManifest('/empty');
    expect(() => {
      readManifest(fakeManifestPath);
    }).toThrow();
  });
});
