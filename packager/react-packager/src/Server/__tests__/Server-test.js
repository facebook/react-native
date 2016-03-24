/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

jest.setMock('worker-farm', function() { return () => {}; })
    .setMock('timers', { setImmediate: (fn) => setTimeout(fn, 0) })
    .setMock('uglify-js')
    .setMock('crypto')
    .mock('../../Bundler')
    .mock('../../AssetServer')
    .mock('../../lib/declareOpts')
    .mock('node-haste')
    .mock('../../Activity');

const Promise = require('promise');

var Bundler = require('../../Bundler');
var Server = require('../');
var AssetServer = require('../../AssetServer');

var FileWatcher;

describe('processRequest', () => {
  var server;

  const options = {
     projectRoots: ['root'],
     blacklistRE: null,
     cacheVersion: null,
     polyfillModuleNames: null
  };

  const makeRequest = (reqHandler, requrl, reqOptions) => new Promise(resolve =>
    reqHandler(
      { url: requrl, headers:{}, ...reqOptions },
      {
        headers: {},
        getHeader(header) { return this.headers[header]; },
        setHeader(header, value) { this.headers[header] = value; },
        end(body) {
          this.body = body;
          resolve(this);
        },
      },
      { next: () => {} },
    )
  );

  const invalidatorFunc = jest.genMockFunction();
  const watcherFunc = jest.genMockFunction();
  var requestHandler;
  var triggerFileChange;

  beforeEach(() => {
    FileWatcher = require('node-haste').FileWatcher;
    Bundler.prototype.bundle = jest.genMockFunction().mockImpl(() =>
      Promise.resolve({
        getSource: () => 'this is the source',
        getSourceMap: () => 'this is the source map',
        getEtag: () => 'this is an etag',
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

    server = new Server(options);
    requestHandler = server.processRequest.bind(server);
  });

  pit('returns JS bundle source on request of *.bundle', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true',
      null
    ).then(response =>
      expect(response.body).toEqual('this is the source')
    );
  });

  pit('returns JS bundle source on request of *.bundle (compat)', () => {
    return makeRequest(
      requestHandler,
      'mybundle.runModule.bundle'
    ).then(response =>
      expect(response.body).toEqual('this is the source')
    );
  });

  pit('returns ETag header on request of *.bundle', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(response => {
      expect(response.getHeader('ETag')).toBeDefined();
    });
  });

  pit('returns 304 on request of *.bundle when if-none-match equals the ETag', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true',
      { headers : { 'if-none-match' : 'this is an etag' } }
    ).then(response => {
      expect(response.statusCode).toEqual(304);
    });
  });

  pit('returns sourcemap on request of *.map', () => {
    return makeRequest(
      requestHandler,
      'mybundle.map?runModule=true'
    ).then(response =>
      expect(response.body).toEqual('this is the source map')
    );
  });

  pit('works with .ios.js extension', () => {
    return makeRequest(
      requestHandler,
      'index.ios.includeRequire.bundle'
    ).then(response => {
      expect(response.body).toEqual('this is the source');
      expect(Bundler.prototype.bundle).toBeCalledWith({
        entryFile: 'index.ios.js',
        inlineSourceMap: false,
        minify: false,
        hot: false,
        runModule: true,
        sourceMapUrl: 'index.ios.includeRequire.map',
        dev: true,
        platform: undefined,
        runBeforeMainModule: ['InitializeJavaScriptAppEngine'],
        unbundle: false,
        entryModuleOnly: false,
      });
    });
  });

  pit('passes in the platform param', function() {
    return makeRequest(
      requestHandler,
      'index.bundle?platform=ios'
    ).then(function(response) {
      expect(response.body).toEqual('this is the source');
      expect(Bundler.prototype.bundle).toBeCalledWith({
        entryFile: 'index.js',
        inlineSourceMap: false,
        minify: false,
        hot: false,
        runModule: true,
        sourceMapUrl: 'index.map?platform=ios',
        dev: true,
        platform: 'ios',
        runBeforeMainModule: ['InitializeJavaScriptAppEngine'],
        unbundle: false,
        entryModuleOnly: false,
      });
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

    it('does not rebuild the bundles that contain a file when that file is changed', () => {
      const bundleFunc = jest.genMockFunction();
      bundleFunc
        .mockReturnValueOnce(
          Promise.resolve({
            getSource: () => 'this is the first source',
            getSourceMap: () => {},
            getEtag: () => () => 'this is an etag',
          })
        )
        .mockReturnValue(
          Promise.resolve({
            getSource: () => 'this is the rebuilt source',
            getSourceMap: () => {},
            getEtag: () => () => 'this is an etag',
          })
        );

      Bundler.prototype.bundle = bundleFunc;

      server = new Server(options);

      requestHandler = server.processRequest.bind(server);

      makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .done(response => {
          expect(response.body).toEqual('this is the first source');
          expect(bundleFunc.mock.calls.length).toBe(1);
        });

      jest.runAllTicks();

      triggerFileChange('all','path/file.js', options.projectRoots[0]);
      jest.runAllTimers();
      jest.runAllTicks();

      expect(bundleFunc.mock.calls.length).toBe(1);

      makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .done(response =>
          expect(response.body).toEqual('this is the rebuilt source')
        );
      jest.runAllTicks();
    });

    it('does not rebuild the bundles that contain a file when that file is changed, even when hot loading is enabled', () => {
      const bundleFunc = jest.genMockFunction();
      bundleFunc
        .mockReturnValueOnce(
          Promise.resolve({
            getSource: () => 'this is the first source',
            getSourceMap: () => {},
            getEtag: () => () => 'this is an etag',
          })
        )
        .mockReturnValue(
          Promise.resolve({
            getSource: () => 'this is the rebuilt source',
            getSourceMap: () => {},
            getEtag: () => () => 'this is an etag',
          })
        );

      Bundler.prototype.bundle = bundleFunc;

      server = new Server(options);
      server.setHMRFileChangeListener(() => {});

      requestHandler = server.processRequest.bind(server);

      makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .done(response => {
          expect(response.body).toEqual('this is the first source');
          expect(bundleFunc.mock.calls.length).toBe(1);
        });

      jest.runAllTicks();

      triggerFileChange('all','path/file.js', options.projectRoots[0]);
      jest.runAllTimers();
      jest.runAllTicks();

      expect(bundleFunc.mock.calls.length).toBe(1);
      server.setHMRFileChangeListener(null);

      makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .done(response => {
          expect(response.body).toEqual('this is the rebuilt source');
          expect(bundleFunc.mock.calls.length).toBe(2);
        });
      jest.runAllTicks();
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
    pit('Calls the bundler with the correct args', () => {
      return server.buildBundle({
        entryFile: 'foo file'
      }).then(() =>
        expect(Bundler.prototype.bundle).toBeCalledWith({
          entryFile: 'foo file',
          inlineSourceMap: false,
          minify: false,
          hot: false,
          runModule: true,
          dev: true,
          platform: undefined,
          runBeforeMainModule: ['InitializeJavaScriptAppEngine'],
          unbundle: false,
          entryModuleOnly: false,
        })
      );
    });
  });

  describe('buildBundleFromUrl(options)', () => {
    pit('Calls the bundler with the correct args', () => {
      return server.buildBundleFromUrl('/path/to/foo.bundle?dev=false&runModule=false')
        .then(() =>
          expect(Bundler.prototype.bundle).toBeCalledWith({
            entryFile: 'path/to/foo.js',
            inlineSourceMap: false,
            minify: false,
            hot: false,
            runModule: false,
            sourceMapUrl: '/path/to/foo.map?dev=false&runModule=false',
            dev: false,
            platform: undefined,
            runBeforeMainModule: ['InitializeJavaScriptAppEngine'],
            unbundle: false,
            entryModuleOnly: false,
          })
        );
    });
  });
});
