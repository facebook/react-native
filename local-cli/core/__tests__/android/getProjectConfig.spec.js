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

const getProjectConfig = require('../../android').projectConfig;
const mockFS = require('mock-fs');
const mocks = require('../../__fixtures__/android');

describe('android::getProjectConfig', () => {
  beforeAll(() => {
    mockFS({
      empty: {},
      nested: {
        android: {
          app: mocks.valid,
        },
      },
      flat: {
        android: mocks.valid,
      },
      multiple: {
        android: mocks.userConfigManifest,
      },
      noManifest: {
        android: {},
      },
    });
  });

  it("returns `null` if manifest file hasn't been found", () => {
    const userConfig = {};
    const folder = 'noManifest';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  describe('returns an object with android project configuration for', () => {
    it('nested structure', () => {
      const userConfig = {};
      const folder = 'nested';

      expect(getProjectConfig(folder, userConfig)).not.toBeNull();
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });

    it('flat structure', () => {
      const userConfig = {};
      const folder = 'flat';

      expect(getProjectConfig(folder, userConfig)).not.toBeNull();
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });

    it('multiple', () => {
      const userConfig = {
        manifestPath: 'src/main/AndroidManifest.xml',
      };
      const folder = 'multiple';

      expect(getProjectConfig(folder, userConfig)).not.toBeNull();
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });
  });

  it('should return `null` if android project was not found', () => {
    const userConfig = {};
    const folder = 'empty';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  afterAll(() => {
    mockFS.restore();
  });
});
