/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../resolveAssetSource');

var resolveAssetSource;
var SourceCode;

describe('resolveAssetSource', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    SourceCode = require('NativeModules').SourceCode;
    resolveAssetSource = require('../resolveAssetSource');
  });

  it('returns same source for simple static and network images', () => {
    var source1 = {uri: 'https://www.facebook.com/logo'};
    expect(resolveAssetSource(source1)).toBe(source1);

    var source2 = {isStatic: true, uri: 'logo'};
    expect(resolveAssetSource(source2)).toBe(source2);
  });

  describe('bundle was loaded from network', () => {
    beforeEach(() => {
      SourceCode.scriptURL = 'http://10.0.0.1:8081/main.bundle';
    });

    it('uses network image', () => {
      var source = {
        path: '/Users/react/project/logo.png',
        uri: 'assets/logo.png',
      };
      expect(resolveAssetSource(source)).toEqual({
        isStatic: false,
        uri: 'http://10.0.0.1:8081/assets/logo.png',
      });
    });

    it('does not change deprecated assets', () => {
      // Deprecated require('image!logo') should stay unchanged
      var source = {
        path: '/Users/react/project/logo.png',
        uri: 'logo',
        deprecated: true,
      };
      expect(resolveAssetSource(source)).toEqual({
        isStatic: true,
        uri: 'logo',
      });
    });
  });

  describe('bundle was loaded from file', () => {
    it('uses pre-packed image', () => {
      SourceCode.scriptURL = 'file:///Path/To/Simulator/main.bundle';

      var source = {
        path: '/Users/react/project/logo.png',
        uri: 'assets/logo.png',
      };
      expect(resolveAssetSource(source)).toEqual({
        isStatic: true,
        uri: 'assets/logo.png',
      });
    });
  });

});
