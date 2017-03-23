/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.disableAutomock();
jest.useRealTimers();

const fetchMock = jest.fn();
jest.mock('node-fetch', () => fetchMock);

const GlobalTransformCache = require('../GlobalTransformCache');
const FetchError = require('node-fetch/lib/fetch-error');

async function fetchResultURIs(keys: Array<string>): Promise<Map<string, string>> {
  return new Map(keys.map(key => [key, `http://globalcache.com/${key}`]));
}

async function fetchResultFromURI(uri: string): Promise<?CachedResult> {
  return {
    code: `/* code from ${uri} */`,
    dependencies: [],
    dependencyOffsets: [],
  };
}

describe('GlobalTransformCache', () => {

  it('fetches results', async () => {
    const cache = new GlobalTransformCache(fetchResultURIs, fetchResultFromURI, null, [
      {dev: true, minify: false, platform: 'ios'},
    ]);
    const transformOptions = {
      dev: true,
      minify: false,
      platform: 'ios',
      transform: {},
    };
    const result = await Promise.all([cache.fetch({
      filePath: 'foo.js',
      sourceCode: '/* beep */',
      getTransformCacheKey: () => 'abcd',
      transformOptions,
    }), cache.fetch({
      filePath: 'bar.js',
      sourceCode: '/* boop */',
      getTransformCacheKey: () => 'abcd',
      transformOptions,
    })]);
    expect(result).toMatchSnapshot();
  });

  describe('fetchResultFromURI', () => {

    const defaultFetchMockImpl = async uri => ({
      status: 200,
      json: async () => ({
        code: `/* code from ${uri} */`,
        dependencies: [],
        dependencyOffsets: [],
      }),
    });

    beforeEach(() => {
      fetchMock.mockReset();
    });

    it('fetches result', async () => {
      fetchMock.mockImplementation(defaultFetchMockImpl);
      const result = await GlobalTransformCache.fetchResultFromURI('http://globalcache.com/foo');
      expect(result).toMatchSnapshot();
    });

    it('retries once on timeout', async () => {
      fetchMock.mockImplementation(async uri => {
        fetchMock.mockImplementation(defaultFetchMockImpl);
        throw new FetchError('timeout!', 'request-timeout');
      });
      const result = await GlobalTransformCache.fetchResultFromURI('http://globalcache.com/foo');
      expect(result).toMatchSnapshot();
    });

  });

});
