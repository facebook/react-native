/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

jest.disableAutomock();

const AssetResolutionCache = require('../AssetResolutionCache');

const MOCK_FILE_NAMES = [
  'test@2x.ios.png',
  'test@1x.ios.png',
  'foo.jpg',
  'bar.ios.png',
  'test@1.5x.ios.png',
  'foo@2x.jpg',
  'test@3x.android.png',
  'test.android.png',
];

describe('AssetResolutionCache', () => {
  let fileNames, cache;

  beforeEach(() => {
    fileNames = [...MOCK_FILE_NAMES];
    cache = new AssetResolutionCache({
      assetExtensions: new Set(['png', 'jpg']),
      getDirFiles: dirPath => (dirPath === '/assets' ? fileNames : []),
      platforms: new Set(['ios', 'android']),
    });
  });

  it('finds the correct assets', () => {
    const results = cache.resolve('/assets', 'test.png', 'ios');
    expect(results).toMatchSnapshot();
  });

  it('correctly clears out', () => {
    cache.resolve('/assets', 'test.png', 'ios');
    fileNames.push('test@3x.ios.png');
    cache.clear();
    const results = cache.resolve('/assets', 'test.png', 'ios');
    expect(results).toMatchSnapshot();
  });
});
