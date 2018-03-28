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

const findAssets = require('../findAssets');
const dependencies = require('../__fixtures__/dependencies');
const fs = require('fs');

describe('findAssets', () => {
  beforeEach(() => {
    fs.__setMockFilesystem({testDir: dependencies.withAssets});
  });

  it('returns an array of all files in given folders', () => {
    const assets = findAssets('/testDir', ['fonts', 'images']);

    expect(Array.isArray(assets)).toBeTruthy();
    expect(assets).toHaveLength(3);
  });

  it('prepends assets paths with the folder path', () => {
    const assets = findAssets('/testDir', ['fonts', 'images']);

    assets.forEach(assetPath => {
      expect(assetPath).toContain('testDir');
    });
  });

  it('returns an empty array if given assets are null', () => {
    expect(findAssets('/testDir', null)).toHaveLength(0);
  });
});
