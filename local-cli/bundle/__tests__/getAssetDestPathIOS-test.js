/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+javascript_foundation
 */
'use strict';

jest.dontMock('../getAssetDestPathIOS');

const getAssetDestPathIOS = require('../getAssetDestPathIOS');

describe('getAssetDestPathIOS', () => {
  it('should build correct path', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetDestPathIOS(asset, 1)).toBe('assets/test/icon.png');
  });

  it('should consider scale', () => {
    const asset = {
      name: 'icon',
      type: 'png',
      httpServerLocation: '/assets/test',
    };

    expect(getAssetDestPathIOS(asset, 2)).toBe('assets/test/icon@2x.png');
    expect(getAssetDestPathIOS(asset, 3)).toBe('assets/test/icon@3x.png');
  });
});
