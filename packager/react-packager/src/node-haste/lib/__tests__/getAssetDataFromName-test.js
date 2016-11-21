/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../getPlatformExtension')
    .dontMock('../getAssetDataFromName');

var getAssetDataFromName = require('../getAssetDataFromName');

describe('getAssetDataFromName', () => {
  it('should get data from name', () => {
    expect(getAssetDataFromName('a/b/c.png')).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });

    expect(getAssetDataFromName('a/b/c@1x.png')).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });

    expect(getAssetDataFromName('a/b/c@2.5x.png')).toEqual({
      resolution: 2.5,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });

    expect(getAssetDataFromName('a/b/c.ios.png')).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: 'ios',
    });

    expect(getAssetDataFromName('a/b/c@1x.ios.png')).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: 'ios',
    });

    expect(getAssetDataFromName('a/b/c@2.5x.ios.png')).toEqual({
      resolution: 2.5,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: 'ios',
    });
  });

  describe('resolution extraction', () => {
    it('should extract resolution simple case', () =>  {
      var data = getAssetDataFromName('test@2x.png');
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 2,
        type: 'png',
        name: 'test',
        platform: null,
      });
    });

    it('should default resolution to 1', () =>  {
      var data = getAssetDataFromName('test.png');
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 1,
        type: 'png',
        name: 'test',
        platform: null,
      });
    });

    it('should support float', () =>  {
      var data = getAssetDataFromName('test@1.1x.png');
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 1.1,
        type: 'png',
        name: 'test',
        platform: null,
      });

      data = getAssetDataFromName('test@.1x.png');
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 0.1,
        type: 'png',
        name: 'test',
        platform: null,
      });

      data = getAssetDataFromName('test@0.2x.png');
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 0.2,
        type: 'png',
        name: 'test',
        platform: null,
      });
    });
  });
});
