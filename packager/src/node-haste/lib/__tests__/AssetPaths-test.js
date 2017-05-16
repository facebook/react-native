/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../parsePlatformFilePath')
    .dontMock('../AssetPaths');

var AssetPaths = require('../AssetPaths');

const TEST_PLATFORMS = new Set(['ios', 'android']);

describe('AssetPaths', () => {
  it('should get data from name', () => {
    expect(AssetPaths.parse('a/b/c.png', TEST_PLATFORMS)).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });

    expect(AssetPaths.parse('a/b/c@1x.png', TEST_PLATFORMS)).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });

    expect(AssetPaths.parse('a/b/c@2.5x.png', TEST_PLATFORMS)).toEqual({
      resolution: 2.5,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });

    expect(AssetPaths.parse('a/b/c.ios.png', TEST_PLATFORMS)).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: 'ios',
    });

    expect(AssetPaths.parse('a/b/c@1x.ios.png', TEST_PLATFORMS)).toEqual({
      resolution: 1,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: 'ios',
    });

    expect(AssetPaths.parse('a/b/c@2.5x.ios.png', TEST_PLATFORMS)).toEqual({
      resolution: 2.5,
      assetName: 'a/b/c.png',
      type: 'png',
      name: 'c',
      platform: 'ios',
    });

    expect(AssetPaths.parse('a/b /c.png', TEST_PLATFORMS)).toEqual({
      resolution: 1,
      assetName: 'a/b /c.png',
      type: 'png',
      name: 'c',
      platform: null,
    });
  });

  describe('resolution extraction', () => {
    it('should extract resolution simple case', () =>  {
      var data = AssetPaths.parse('test@2x.png', TEST_PLATFORMS);
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 2,
        type: 'png',
        name: 'test',
        platform: null,
      });
    });

    it('should default resolution to 1', () =>  {
      var data = AssetPaths.parse('test.png', TEST_PLATFORMS);
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 1,
        type: 'png',
        name: 'test',
        platform: null,
      });
    });

    it('should support float', () =>  {
      var data = AssetPaths.parse('test@1.1x.png', TEST_PLATFORMS);
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 1.1,
        type: 'png',
        name: 'test',
        platform: null,
      });

      data = AssetPaths.parse('test@.1x.png', TEST_PLATFORMS);
      expect(data).toEqual({
        assetName: 'test.png',
        resolution: 0.1,
        type: 'png',
        name: 'test',
        platform: null,
      });

      data = AssetPaths.parse('test@0.2x.png', TEST_PLATFORMS);
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
