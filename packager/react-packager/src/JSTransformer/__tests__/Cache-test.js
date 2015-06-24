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
  .dontMock('underscore')
  .dontMock('absolute-path')
  .dontMock('../Cache');

jest
  .mock('os')
  .mock('fs');

var Promise = require('promise');

describe('JSTransformer Cache', function() {
  var Cache;

  beforeEach(function() {
    require('os').tmpDir.mockImpl(function() {
      return 'tmpDir';
    });

    Cache = require('../Cache');
  });

  describe('getting/setting', function() {
    it('calls loader callback for uncached file', function() {
      var cache = new Cache({
        projectRoots: ['/rootDir'],
        transformModulePath: 'x.js',
      });
      var loaderCb = jest.genMockFn().mockImpl(function() {
        return Promise.resolve();
      });

      cache.get('/rootDir/someFile', loaderCb);
      expect(loaderCb).toBeCalledWith('/rootDir/someFile');
    });

    pit('gets the value from the loader callback', function() {
      require('fs').stat.mockImpl(function(file, callback) {
        callback(null, {
          mtime: {
            getTime: function() {}
          }
        });
      });

      var cache = new Cache({
        projectRoots: ['/rootDir'],
        transformModulePath: 'x.js',
      });
      var loaderCb = jest.genMockFn().mockImpl(function() {
        return Promise.resolve('lol');
      });

      return cache.get('/rootDir/someFile', loaderCb).then(function(value) {
        expect(value).toBe('lol');
      });
    });

    pit('caches the value after the first call', function() {
      require('fs').stat.mockImpl(function(file, callback) {
        callback(null, {
          mtime: {
            getTime: function() {}
          }
        });
      });

      var cache = new Cache({
        projectRoots: ['/rootDir'],
        transformModulePath: 'x.js',
      });
      var loaderCb = jest.genMockFn().mockImpl(function() {
        return Promise.resolve('lol');
      });

      return cache.get('/rootDir/someFile', loaderCb).then(function() {
        var shouldNotBeCalled = jest.genMockFn();
        return cache.get('/rootDir/someFile', shouldNotBeCalled)
          .then(function(value) {
            expect(shouldNotBeCalled).not.toBeCalled();
            expect(value).toBe('lol');
          });
      });
    });
  });

  describe('loading cache from disk', function() {
    var fileStats;

    beforeEach(function() {
      fileStats = {
        '/rootDir/someFile': {
          mtime: {
            getTime: function() {
              return 22;
            }
          }
        },
        '/rootDir/foo': {
          mtime: {
            getTime: function() {
              return 11;
            }
          }
        }
      };

      var fs = require('fs');

      fs.existsSync.mockImpl(function() {
        return true;
      });

      fs.statSync.mockImpl(function(filePath) {
        return fileStats[filePath];
      });

      fs.readFileSync.mockImpl(function() {
        return JSON.stringify({
          '/rootDir/someFile': {
            mtime: 22,
            data: 'oh hai'
          },
          '/rootDir/foo': {
            mtime: 11,
            data: 'lol wat'
          }
        });
      });
    });

    pit('should load cache from disk', function() {
      var cache = new Cache({
        projectRoots: ['/rootDir'],
        transformModulePath: 'x.js',
      });
      var loaderCb = jest.genMockFn();

      return cache.get('/rootDir/someFile', loaderCb).then(function(value) {
        expect(loaderCb).not.toBeCalled();
        expect(value).toBe('oh hai');

        return cache.get('/rootDir/foo', loaderCb).then(function(value) {
          expect(loaderCb).not.toBeCalled();
          expect(value).toBe('lol wat');
        });
      });
    });

    pit('should not load outdated cache', function() {
      require('fs').stat.mockImpl(function(file, callback) {
        callback(null, {
          mtime: {
            getTime: function() {}
          }
        });
      });

      fileStats['/rootDir/foo'].mtime.getTime = function() {
        return 123;
      };

      var cache = new Cache({
        projectRoots: ['/rootDir'],
        transformModulePath: 'x.js',
      });
      var loaderCb = jest.genMockFn().mockImpl(function() {
        return Promise.resolve('new value');
      });

      return cache.get('/rootDir/someFile', loaderCb).then(function(value) {
        expect(loaderCb).not.toBeCalled();
        expect(value).toBe('oh hai');

        return cache.get('/rootDir/foo', loaderCb).then(function(value) {
          expect(loaderCb).toBeCalled();
          expect(value).toBe('new value');
        });
      });
    });
  });

  describe('writing cache to disk', function() {
    it('should write cache to disk', function() {
      var index = 0;
      var mtimes = [10, 20, 30];
      var debounceIndex = 0;
      require('underscore').debounce = function(callback) {
        return function () {
          if (++debounceIndex === 3) {
            callback();
          }
        };
      };

      var fs = require('fs');
      fs.stat.mockImpl(function(file, callback) {
        callback(null, {
          mtime: {
            getTime: function() {
              return mtimes[index++];
            }
          }
        });
      });

      var cache = new Cache({
        projectRoots: ['/rootDir'],
        transformModulePath: 'x.js',
      });

      cache.get('/rootDir/bar', function() {
        return Promise.resolve('bar value');
      });
      cache.get('/rootDir/foo', function() {
        return Promise.resolve('foo value');
      });
      cache.get('/rootDir/baz', function() {
        return Promise.resolve('baz value');
      });

      jest.runAllTicks();
      expect(fs.writeFile).toBeCalled();
    });
  });
});
