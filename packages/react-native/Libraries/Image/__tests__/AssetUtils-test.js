/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {getUrlCacheBreaker, setUrlCacheBreaker} from '../AssetUtils';

describe('AssetUtils', () => {
  afterEach(() => {
    global.__DEV__ = true;
    jest.clearAllMocks();
  });

  test('should return empty string and warn once if no cacheBreaker set (DEV)', () => {
    const mockWarn = jest.spyOn(console, 'warn').mockReturnValue(undefined);
    global.__DEV__ = true;
    expect(getUrlCacheBreaker()).toEqual('');
    expect(getUrlCacheBreaker()).toEqual('');
    expect(mockWarn).toHaveBeenCalledTimes(1);
  });

  test('should return empty string if no cacheBreaker set in prod', () => {
    const mockWarn = jest.spyOn(console, 'warn');
    global.__DEV__ = false;
    expect(getUrlCacheBreaker()).toEqual('');
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('should return set cacheBreaker value', () => {
    setUrlCacheBreaker('my-cache-breaker-value');
    expect(getUrlCacheBreaker()).toEqual('my-cache-breaker-value');
  });
});
