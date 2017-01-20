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
  .dontMock('../');

jest
  .mock('fs')
  .setMock('os', {
    tmpdir() { return 'tmpdir'; },
  });

jest.useRealTimers();


describe('Cache', () => {
  let Cache, fs;
  beforeEach(() => {
    Cache = require('../');
    fs = require('graceful-fs');
  });

  describe('getting/setting', () => {
    it('calls loader callback for uncached file', () => {
      fs.stat.mockImplementation((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImplementation(() => Promise.resolve());

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then($ =>
          expect(loaderCb).toBeCalledWith('/rootDir/someFile')
        );
    });

    it('supports storing multiple fields', () => {
      fs.stat.mockImplementation((file, callback) => {
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
      var loaderCb = jest.genMockFn().mockImplementation(() =>
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

    it('gets the value from the loader callback', () => {
      fs.stat.mockImplementation((file, callback) =>
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        })
      );

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImplementation(() =>
        Promise.resolve('lol')
      );

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .then(value => expect(value).toBe('lol'));
    });

    it('caches the value after the first call', () => {
      fs.stat.mockImplementation((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImplementation(() =>
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

    it('clears old field when getting new field and mtime changed', () => {
      var mtime = 0;
      fs.stat.mockImplementation((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => mtime++,
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImplementation(() =>
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

    it('does not cache rejections', () => {
      fs.stat.mockImplementation((file, callback) => {
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        });
      });

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = () => Promise.reject('lol');

      return cache
        .get('/rootDir/someFile', 'field', loaderCb)
        .catch(() => {
          var shouldBeCalled = jest.fn(() => Promise.resolve());
          const assert = value => expect(shouldBeCalled).toBeCalled();
          return cache.get('/rootDir/someFile', 'field', shouldBeCalled)
            .then(assert, assert);
        });
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

      fs.existsSync.mockImplementation(() => true);

      fs.statSync.mockImplementation(filePath => fileStats[filePath]);

      fs.readFileSync.mockImplementation(() => JSON.stringify({
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

    it('should load cache from disk', () => {
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

    it('should not load outdated cache', () => {
      fs.stat.mockImplementation((file, callback) =>
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
      var loaderCb = jest.genMockFn().mockImplementation(() =>
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
    it('should write cache to disk', (done) => {
      var index = 0;
      var mtimes = [10, 20, 30];

      fs.stat.mockImplementation((file, callback) =>
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

      setTimeout(() => {
        expect(fs.writeFile).toBeCalled();
        done();
      }, 2020);
    });
  });

  describe('check for cache presence', () => {
    it('synchronously resolves cache presence', () => {
      fs.stat.mockImplementation((file, callback) =>
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        })
      );

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImplementation(() =>
        Promise.resolve('banana')
      );
      var file = '/rootDir/someFile';

      return cache
        .get(file, 'field', loaderCb)
        .then(() => {
          expect(cache.has(file)).toBe(true);
          expect(cache.has(file, 'field')).toBe(true);
          expect(cache.has(file, 'foo')).toBe(false);
        });
    });
  });

  describe('invalidate', () => {
    it('invalidates the cache per file or per-field', () => {
      fs.stat.mockImplementation((file, callback) =>
        callback(null, {
          mtime: {
            getTime: () => {},
          },
        })
      );

      var cache = new Cache({
        cacheKey: 'cache',
      });
      var loaderCb = jest.genMockFn().mockImplementation(() =>
        Promise.resolve('banana')
      );
      var file = '/rootDir/someFile';

      return cache.get(file, 'field', loaderCb).then(() => {
        expect(cache.has(file)).toBe(true);
        cache.invalidate(file, 'field');
        expect(cache.has(file)).toBe(true);
        expect(cache.has(file, 'field')).toBe(false);
        cache.invalidate(file);
        expect(cache.has(file)).toBe(false);
      });
    });
  });
});
