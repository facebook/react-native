/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.setMock('worker-farm', function() { return () => {}; })
    .dontMock('os')
    .dontMock('path')
    .dontMock('url')
    .setMock('timers', { setImmediate: (fn) => setTimeout(fn, 0) })
    .setMock('uglify-js')
    .dontMock('../')
    .setMock('chalk', { dim: function(s) { return s; } });

const Promise = require('promise');

describe('processRequest', () => {
  var server;
  var Bundler;
  var FileWatcher;

  const options = {
     projectRoots: ['root'],
     blacklistRE: null,
     cacheVersion: null,
     polyfillModuleNames: null
  };

  const makeRequest = (reqHandler, requrl) => new Promise(resolve =>
    reqHandler(
      { url: requrl },
      {
        setHeader: jest.genMockFunction(),
        end: res => resolve(res),
      },
      { next: () => {} },
    )
  );

  const invalidatorFunc = jest.genMockFunction();
  const watcherFunc = jest.genMockFunction();
  var requestHandler;
  var triggerFileChange;

  beforeEach(() => {
    Bundler = require('../../Bundler');
    FileWatcher = require('../../FileWatcher');

    Bundler.prototype.bundle = jest.genMockFunction().mockImpl(() =>
      Promise.resolve({
        getSource: () => 'this is the source',
        getSourceMap: () => 'this is the source map',
      })
    );

    FileWatcher.prototype.on = function(eventType, callback) {
      if (eventType !== 'all') {
        throw new Error('Can only handle "all" event in watcher.');
      }
      watcherFunc.apply(this, arguments);
      triggerFileChange = callback;
      return this;
    };

    Bundler.prototype.invalidateFile = invalidatorFunc;

    const Server = require('../');
    server = new Server(options);
    requestHandler = server.processRequest.bind(server);
  });

  pit('returns JS bundle source on request of *.bundle', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(response =>
      expect(response).toEqual('this is the source')
    );
  });

  pit('returns JS bundle source on request of *.bundle (compat)', () => {
    return makeRequest(
      requestHandler,
      'mybundle.runModule.bundle'
    ).then(response =>
      expect(response).toEqual('this is the source')
    );
  });

  pit('returns sourcemap on request of *.map', () => {
    return makeRequest(
      requestHandler,
      'mybundle.map?runModule=true'
    ).then(response =>
      expect(response).toEqual('"this is the source map"')
    );
  });

  pit('works with .ios.js extension', () => {
    return makeRequest(
      requestHandler,
      'index.ios.includeRequire.bundle'
    ).then(response => {
      expect(response).toEqual('this is the source');
      expect(Bundler.prototype.bundle).toBeCalledWith(
        'index.ios.js',
        true,
        'index.ios.includeRequire.map',
        true,
        undefined
      );
    });
  });

  pit('passes in the platform param', function() {
    return makeRequest(
      requestHandler,
      'index.bundle?platform=ios'
    ).then(function(response) {
      expect(response).toEqual('this is the source');
      expect(Bundler.prototype.bundle).toBeCalledWith(
        'index.js',
        true,
        'index.map',
        true,
        'ios',
      );
    });
  });

  pit('watches all files in projectRoot', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(() => {
      expect(watcherFunc.mock.calls[0][0]).toEqual('all');
      expect(watcherFunc.mock.calls[0][1]).not.toBe(null);
    });
  });

  describe('file changes', () => {
    pit('invalides files in bundle when file is updated', () => {
      return makeRequest(
        requestHandler,
        'mybundle.bundle?runModule=true'
      ).then(() => {
        const onFileChange = watcherFunc.mock.calls[0][1];
        onFileChange('all','path/file.js', options.projectRoots[0]);
        expect(invalidatorFunc.mock.calls[0][0]).toEqual('root/path/file.js');
      });
    });

    pit('rebuilds the bundles that contain a file when that file is changed', () => {
      const bundleFunc = jest.genMockFunction();
      bundleFunc
        .mockReturnValueOnce(
          Promise.resolve({
            getSource: () => 'this is the first source',
            getSourceMap: () => {},
          })
        )
        .mockReturnValue(
          Promise.resolve({
            getSource: () => 'this is the rebuilt source',
            getSourceMap: () => {},
          })
        );

      Bundler.prototype.bundle = bundleFunc;

      const Server = require('../../Server');
      server = new Server(options);

      requestHandler = server.processRequest.bind(server);

      return makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .then(response => {
          expect(response).toEqual('this is the first source');
          expect(bundleFunc.mock.calls.length).toBe(1);
          triggerFileChange('all','path/file.js', options.projectRoots[0]);
          jest.runAllTimers();
          jest.runAllTimers();
        })
        .then(() => {
          expect(bundleFunc.mock.calls.length).toBe(2);
          return makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
            .then(response =>
              expect(response).toEqual('this is the rebuilt source')
            );
        });
    });
  });

  describe('/onchange endpoint', () => {
    var EventEmitter;
    var req;
    var res;

    beforeEach(() => {
      EventEmitter = require.requireActual('events').EventEmitter;
      req = new EventEmitter();
      req.url = '/onchange';
      res = {
        writeHead: jest.genMockFn(),
        end: jest.genMockFn()
      };
    });

    it('should hold on to request and inform on change', () => {
      server.processRequest(req, res);
      triggerFileChange('all', 'path/file.js', options.projectRoots[0]);
      jest.runAllTimers();
      expect(res.end).toBeCalledWith(JSON.stringify({changed: true}));
    });

    it('should not inform changes on disconnected clients', () => {
      server.processRequest(req, res);
      req.emit('close');
      jest.runAllTimers();
      triggerFileChange('all', 'path/file.js', options.projectRoots[0]);
      jest.runAllTimers();
      expect(res.end).not.toBeCalled();
    });
  });

  describe('/assets endpoint', () => {
    var AssetServer;
    beforeEach(() => {
      AssetServer = require('../../AssetServer');
    });

    it('should serve simple case', () => {
      const req = {url: '/assets/imgs/a.png'};
      const res = {end: jest.genMockFn()};

      AssetServer.prototype.get.mockImpl(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(res.end).toBeCalledWith('i am image');
    });

    it('should parse the platform option', () => {
      const req = {url: '/assets/imgs/a.png?platform=ios'};
      const res = {end: jest.genMockFn()};

      AssetServer.prototype.get.mockImpl(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith('imgs/a.png', 'ios');
      expect(res.end).toBeCalledWith('i am image');
    });
  });

  describe('buildbundle(options)', () => {
    it('Calls the bundler with the correct args', () => {
      server.buildBundle({
        entryFile: 'foo file'
      });
      expect(Bundler.prototype.bundle).toBeCalledWith(
        'foo file',
        true,
        undefined,
        true,
        undefined
      );
    });
  });

  describe('buildBundleFromUrl(options)', () => {
    it('Calls the bundler with the correct args', () => {
      server.buildBundleFromUrl('/path/to/foo.bundle?dev=false&runModule=false');
      expect(Bundler.prototype.bundle).toBeCalledWith(
        'path/to/foo.js',
        false,
        '/path/to/foo.map',
        false,
        undefined
      );
    });
  });
});
