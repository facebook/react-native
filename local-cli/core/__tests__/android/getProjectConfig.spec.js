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

const getProjectConfig = require('../../android').projectConfig;
const fs = require('fs');
const mocks = require('../../__fixtures__/android');

describe('android::getProjectConfig', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
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
    const folder = '/noManifest';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });

  describe('returns an object with android project configuration for', () => {
    it('nested structure', () => {
      const userConfig = {};
      const folder = '/nested';

      expect(getProjectConfig(folder, userConfig)).not.toBeNull();
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });

    it('flat structure', () => {
      const userConfig = {};
      const folder = '/flat';

      expect(getProjectConfig(folder, userConfig)).not.toBeNull();
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });

    it('multiple', () => {
      const userConfig = {
        manifestPath: 'src/main/AndroidManifest.xml',
      };
      const folder = '/multiple';

      expect(getProjectConfig(folder, userConfig)).not.toBeNull();
      expect(typeof getProjectConfig(folder, userConfig)).toBe('object');
    });
  });

  it('should return `null` if android project was not found', () => {
    const userConfig = {};
    const folder = '/empty';

    expect(getProjectConfig(folder, userConfig)).toBeNull();
  });
});
