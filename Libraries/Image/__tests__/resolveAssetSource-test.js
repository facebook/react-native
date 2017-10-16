/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var AssetRegistry = require('AssetRegistry');
var Platform = require('Platform');
var NativeModules = require('NativeModules');
var resolveAssetSource = require('../resolveAssetSource');

function expectResolvesAsset(input, expectedSource) {
  var assetId = AssetRegistry.registerAsset(input);
  expect(resolveAssetSource(assetId)).toEqual(expectedSource);
}

describe('resolveAssetSource', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns same source for simple static and network images', () => {
    var source1 = {uri: 'https://www.facebook.com/logo'};
    expect(resolveAssetSource(source1)).toBe(source1);

    var source2 = {uri: 'logo'};
    expect(resolveAssetSource(source2)).toBe(source2);
  });

  it('does not change deprecated assets', () => {
    expect(resolveAssetSource({
      deprecated: true,
      width: 100,
      height: 200,
      uri: 'logo',
    })).toEqual({
      deprecated: true,
      width: 100,
      height: 200,
      uri: 'logo',
    });
  });

  it('ignores any weird data', () => {
    expect(resolveAssetSource(null)).toBe(null);
    expect(resolveAssetSource(42)).toBe(null);
    expect(resolveAssetSource('nonsense')).toBe(null);
  });

  describe('bundle was loaded from network (DEV)', () => {
    beforeEach(() => {
      NativeModules.SourceCode.scriptURL =
        'http://10.0.0.1:8081/main.bundle';
      Platform.OS = 'ios';
    });

    it('uses network image', () => {
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/module/a',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: 'logo',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'http://10.0.0.1:8081/assets/module/a/logo.png?platform=ios&hash=5b6f00f',
        scale: 1,
      });
    });

    it('picks matching scale', () => {
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/module/a',
        width: 100,
        height: 200,
        scales: [1, 2, 3],
        hash: '5b6f00f',
        name: 'logo',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'http://10.0.0.1:8081/assets/module/a/logo@2x.png?platform=ios&hash=5b6f00f',
        scale: 2,
      });
    });

  });

  describe('bundle was loaded from file on iOS', () => {
    beforeEach(() => {
      NativeModules.SourceCode.scriptURL =
        'file:///Path/To/Sample.app/main.bundle';
      Platform.OS = 'ios';
    });

    it('uses pre-packed image', () => {
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/module/a',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: 'logo',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'file:///Path/To/Sample.app/assets/module/a/logo.png',
        scale: 1,
      });
    });
  });

  describe('bundle was loaded from assets on Android', () => {
    beforeEach(() => {
      NativeModules.SourceCode.scriptURL =
        'assets://Path/To/Simulator/main.bundle';
      Platform.OS = 'android';
    });

    it('uses pre-packed image', () => {
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/AwesomeModule/Subdir',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: '!@Logo#1_€', // Invalid chars shouldn't get passed to native
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'awesomemodule_subdir_logo1_',
        scale: 1,
      });
    });
  });

  describe('bundle was loaded from file on Android', () => {
    beforeEach(() => {
      NativeModules.SourceCode.scriptURL =
        'file:///sdcard/Path/To/Simulator/main.bundle';
      Platform.OS = 'android';
    });

    it('uses pre-packed image', () => {
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/AwesomeModule/Subdir',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: '!@Logo#1_€',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'file:///sdcard/Path/To/Simulator/drawable-mdpi/awesomemodule_subdir_logo1_.png',
        scale: 1,
      });
    });
  });

  describe('bundle was loaded from raw file on Android', () => {
    beforeEach(() => {
      NativeModules.SourceCode.scriptURL =
        '/sdcard/Path/To/Simulator/main.bundle';
      Platform.OS = 'android';
    });

    it('uses sideloaded image', () => {
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/AwesomeModule/Subdir',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: '!@Logo#1_€',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'file:///sdcard/Path/To/Simulator/drawable-mdpi/awesomemodule_subdir_logo1_.png',
        scale: 1,
      });
    });
  });

  describe('source resolver can be customized', () => {
    beforeEach(() => {
      NativeModules.SourceCode.scriptURL =
        'file:///sdcard/Path/To/Simulator/main.bundle';
      Platform.OS = 'android';
    });

    it('uses bundled source, event when js is sideloaded', () => {
      resolveAssetSource.setCustomSourceTransformer(
        (resolver) => resolver.resourceIdentifierWithoutScale(),
      );
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/AwesomeModule/Subdir',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: '!@Logo#1_€',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'awesomemodule_subdir_logo1_',
        scale: 1,
      });
    });

    it('allows any customization', () => {
      resolveAssetSource.setCustomSourceTransformer(
        (resolver) => resolver.fromSource('TEST')
      );
      expectResolvesAsset({
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/AwesomeModule/Subdir',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: '!@Logo#1_€',
        type: 'png',
      }, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'TEST',
        scale: 1,
      });
    });
  });

});

describe('resolveAssetSource.pickScale', () => {
  it('picks matching scale', () => {
    expect(resolveAssetSource.pickScale([1], 2)).toBe(1);
    expect(resolveAssetSource.pickScale([1, 2, 3], 2)).toBe(2);
    expect(resolveAssetSource.pickScale([1, 2], 3)).toBe(2);
    expect(resolveAssetSource.pickScale([1, 2, 3, 4], 3.5)).toBe(4);
    expect(resolveAssetSource.pickScale([3, 4], 2)).toBe(3);
    expect(resolveAssetSource.pickScale([], 2)).toBe(1);
  });
});
