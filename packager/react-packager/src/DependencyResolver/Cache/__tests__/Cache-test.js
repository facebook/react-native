/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .dontMock('absolute-path')
  .dontMock('../')
  .dontMock('../lib/loadCacheSync')
  .dontMock('../lib/getCacheFilePath');

jest
  .mock('fs')
  .setMock('os', {
    tmpDir() { return 'tmpDir'; },
  });

var Promise = require('promise');
var fs = require('fs');

var Cache = require('../');

describe('Cache', () => {
  describe('getting/setting', () => {
    pit('calls loader callback for uncached file', () => {
      fs.stat.mockImpl((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImpl(() => Promise.resolve());

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then($ =>
          expect(loaderCb).toBeCalledWith('/rootDir/someFile')
        );
    });

    pit('supports storing multiple fields', () => {
      fs.stat.mockImpl((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var index = 0;
      var loaderCb = jest.genMockFn().mockImpl(() =>
        Promise.resolve(index++)
      );

      return cache
        .get('/rootDir/someFile', 'field1', loaderCb)
        .then(value => {
          expect(value).toBe(0);
          return cache
            .get('/rootDir/someFile', 'field2', loaderCb)
            .then(value2 => expect(value2).toBe(1));
        });
    });

    pit('gets the value from the loader callback', () => {
      fs.stat.mockImpl((file, callback) =>
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        })
      );

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImpl(() =>
        Promise.resolve('lol')
      );

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then(value => expect(value).toBe('lol'));
    });

    pit('caches the value after the first call', () => {
      fs.stat.mockImpl((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImpl(() =>
        Promise.resolve('lol')
      );

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then(() => {
          var shouldNotBeCalled = jest.genMockFn();
          return cache.get('/rootDir/someFile', 'field', shouldNotBeCalled)
            .then(value => {
              expect(shouldNotBeCalled).not.toBeCalled();
              expect(value).toBe('lol');
            });
        });
    });

    pit('clears old field when getting new field and mtime changed', () => {
      var mtime = 0;
      fs.stat.mockImpl((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => mtime++,
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImpl(() =>
        Promise.resolve('lol' + mtime)
      );

      return cache
        .get('/rootDir/someFile', 'field1', loaderCb)
        .then(value => cache
          .get('/rootDir/someFile', 'field2', loaderCb)
          .then(value2 => cache
            .get('/rootDir/someFile', 'field1', loaderCb)
            .then(value3 => expect(value3).toBe('lol2'))
          )
        );
    });
  });

  describe('loading cache from disk', () => {
    var fileStats;

    beforeEach(() => {
      fileStats = {
        '/rootDir/someFile': {
          mtime: {
            getTime: () => 22,
          },
        },
        '/rootDir/foo': {
          mtime: {
            getTime: () => 11,
          },
        },
      };

      fs.existsSync.mockImpl(() => true);

      fs.statSync.mockImpl(filePath => fileStats[filePath]);

      fs.readFileSync.mockImpl(() => JSON.stringify({
        '/rootDir/someFile': {
          metadata: {mtime: 22},
          data: {field: 'oh hai'},
        },
        '/rootDir/foo': {
          metadata: {mtime: 11},
          data: {field: 'lol wat'},
        },
      }));
    });

    pit('should load cache from disk', () => {
      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn();

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then(value => {
          expect(loaderCb).not.toBeCalled();
          expect(value).toBe('oh hai');

          return cache
            .get('/rootDir/foo', 'field', loaderCb)
            .then(val => {
              expect(loaderCb).not.toBeCalled();
              expect(val).toBe('lol wat');
            });
        });
    });

    pit('should not load outdated cache', () => {
      fs.stat.mockImpl((file, callback) =>
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        })
      );

      fileStats['/rootDir/foo'].mtime.getTime = () => 123;

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImpl(() =>
        Promise.resolve('new value')
      );

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then(value => {
          expect(loaderCb).not.toBeCalled();
          expect(value).toBe('oh hai');

          return cache
            .get('/rootDir/foo', 'field', loaderCb)
            .then(val => {
              expect(loaderCb).toBeCalled();
              expect(val).toBe('new value');
            });
        });
    });
  });

  describe('writing cache to disk', () => {
    it('should write cache to disk', () => {
      var index = 0;
      var mtimes = [10, 20, 30];

      fs.stat.mockImpl((file, callback) =>
        callback(null, {
          mtime: {
            getTime: () => mtimes[index++],
          },
        })
      );

      var cache = new Cache({
        cacheKey: 'cache',
      });

      cache.get('/rootDir/bar', 'field', () =>
        Promise.resolve('bar value')
      );
      cache.get('/rootDir/foo', 'field', () =>
        Promise.resolve('foo value')
      );
      cache.get('/rootDir/baz', 'field', () =>
        Promise.resolve('baz value')
      );

      // jest has some trouble with promises and timeouts within promises :(
      jest.runAllTimers();
      jest.runAllTimers();

      expect(fs.writeFile).toBeCalled();
    });
  });
});
