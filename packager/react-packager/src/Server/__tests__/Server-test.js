/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

jest.setMock('worker-farm', function() { return () => {}; })
    .setMock('timers', { setImmediate: (fn) => setTimeout(fn, 0) })
    .setMock('uglify-js')
    .setMock('crypto')
    .setMock('source-map', { SourceMapConsumer: function(fn) {}})
    .mock('../../Bundler')
    .mock('../../AssetServer')
    .mock('../../lib/declareOpts')
    .mock('../../node-haste')
    .mock('../../Logger');

describe('processRequest', () => {
  let SourceMapConsumer, Bundler, Server, AssetServer, Promise;
  beforeEach(() => {
    jest.resetModules();
    SourceMapConsumer = require('source-map').SourceMapConsumer;
    Bundler = require('../../Bundler');
    Server = require('../');
    AssetServer = require('../../AssetServer');
    Promise = require('promise');
  });

  let server;

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
        statusCode: 200,
        headers: {},
        getHeader(header) { return this.headers[header]; },
        setHeader(header, value) { this.headers[header] = value; },
        writeHead(statusCode) { this.statusCode = statusCode; },
        end(body) {
          this.body = body;
          resolve(this);
        },
      },
      { next: () => {} },
    )
  );

  const invalidatorFunc = jest.fn();
  let requestHandler;

  beforeEach(() => {
    Bundler.prototype.bundle = jest.fn(() =>
      Promise.resolve({
        getSource: () => 'this is the source',
        getSourceMap: () => 'this is the source map',
        getEtag: () => 'this is an etag',
      }));

    Bundler.prototype.invalidateFile = invalidatorFunc;
    Bundler.prototype.getResolver =
      jest.fn().mockReturnValue({
        getDependencyGraph: jest.fn().mockReturnValue({
          getHasteMap: jest.fn().mockReturnValue({on: jest.fn()}),
          load: jest.fn(() => Promise.resolve()),
        }),
      });

    server = new Server(options);
    requestHandler = server.processRequest.bind(server);
  });

  it('returns JS bundle source on request of *.bundle', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true',
      null
    ).then(response =>
      expect(response.body).toEqual('this is the source')
    );
  });

  it('returns JS bundle source on request of *.bundle (compat)', () => {
    return makeRequest(
      requestHandler,
      'mybundle.runModule.bundle'
    ).then(response =>
      expect(response.body).toEqual('this is the source')
    );
  });

  it('returns ETag header on request of *.bundle', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(response => {
      expect(response.getHeader('ETag')).toBeDefined();
    });
  });

  it('returns 304 on request of *.bundle when if-none-match equals the ETag', () => {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true',
      { headers : { 'if-none-match' : 'this is an etag' } }
    ).then(response => {
      expect(response.statusCode).toEqual(304);
    });
  });

  it('returns sourcemap on request of *.map', () => {
    return makeRequest(
      requestHandler,
      'mybundle.map?runModule=true'
    ).then(response =>
      expect(response.body).toEqual('this is the source map')
    );
  });

  it('works with .ios.js extension', () => {
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
        onProgress: jasmine.any(Function),
        runBeforeMainModule: ['InitializeCore'],
        unbundle: false,
        entryModuleOnly: false,
        isolateModuleIDs: false,
        assetPlugins: [],
      });
    });
  });

  it('passes in the platform param', function() {
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
        onProgress: jasmine.any(Function),
        runBeforeMainModule: ['InitializeCore'],
        unbundle: false,
        entryModuleOnly: false,
        isolateModuleIDs: false,
        assetPlugins: [],
      });
    });
  });

  it('passes in the assetPlugin param', function() {
    return makeRequest(
      requestHandler,
      'index.bundle?assetPlugin=assetPlugin1&assetPlugin=assetPlugin2'
    ).then(function(response) {
      expect(response.body).toEqual('this is the source');
      expect(Bundler.prototype.bundle).toBeCalledWith({
        entryFile: 'index.js',
        inlineSourceMap: false,
        minify: false,
        hot: false,
        runModule: true,
        sourceMapUrl: 'index.map?assetPlugin=assetPlugin1&assetPlugin=assetPlugin2',
        dev: true,
        platform: undefined,
        onProgress: jasmine.any(Function),
        runBeforeMainModule: ['InitializeCore'],
        unbundle: false,
        entryModuleOnly: false,
        isolateModuleIDs: false,
        assetPlugins: ['assetPlugin1', 'assetPlugin2'],
      });
    });
  });

  describe('file changes', () => {
    it('invalides files in bundle when file is updated', () => {
      return makeRequest(
        requestHandler,
        'mybundle.bundle?runModule=true'
      ).then(() => {
        server.onFileChange('all', options.projectRoots[0] + '/path/file.js');
        expect(invalidatorFunc.mock.calls[0][0]).toEqual('root/path/file.js');
      });
    });

    it('does not rebuild the bundles that contain a file when that file is changed', () => {
      const bundleFunc = jest.fn();
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

      server.onFileChange('all', options.projectRoots[0] + 'path/file.js');
      jest.runAllTimers();
      jest.runAllTicks();

      expect(bundleFunc.mock.calls.length).toBe(1);

      makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .done(response =>
          expect(response.body).toEqual('this is the rebuilt source')
        );
      jest.runAllTicks();
    });

    it(
      'does not rebuild the bundles that contain a file ' +
      'when that file is changed, even when hot loading is enabled',
      () => {
        const bundleFunc = jest.fn();
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

        server.onFileChange('all', options.projectRoots[0] + 'path/file.js');
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
    let EventEmitter;
    let req;
    let res;

    beforeEach(() => {
      EventEmitter = require.requireActual('events').EventEmitter;
      req = new EventEmitter();
      req.url = '/onchange';
      res = {
        writeHead: jest.fn(),
        end: jest.fn()
      };
    });

    it('should hold on to request and inform on change', () => {
      server.processRequest(req, res);
      server.onFileChange('all', options.projectRoots[0] + 'path/file.js');
      jest.runAllTimers();
      expect(res.end).toBeCalledWith(JSON.stringify({changed: true}));
    });

    it('should not inform changes on disconnected clients', () => {
      server.processRequest(req, res);
      req.emit('close');
      jest.runAllTimers();
      server.onFileChange('all', options.projectRoots[0] + 'path/file.js');
      jest.runAllTimers();
      expect(res.end).not.toBeCalled();
    });
  });

  describe('/assets endpoint', () => {
    it('should serve simple case', () => {
      const req = {url: '/assets/imgs/a.png'};
      const res = {end: jest.fn(), setHeader: jest.fn()};

      AssetServer.prototype.get.mockImpl(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(res.setHeader).toBeCalledWith('Cache-Control', 'max-age=31536000');
      expect(res.end).toBeCalledWith('i am image');
    });

    it('should parse the platform option', () => {
      const req = {url: '/assets/imgs/a.png?platform=ios'};
      const res = {end: jest.fn(), setHeader: jest.fn()};

      AssetServer.prototype.get.mockImpl(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith('imgs/a.png', 'ios');
      expect(res.setHeader).toBeCalledWith('Cache-Control', 'max-age=31536000');
      expect(res.end).toBeCalledWith('i am image');
    });

    it('should serve range request', () => {
      const req = {url: '/assets/imgs/a.png?platform=ios', headers: {range: 'bytes=0-3'}};
      const res = {end: jest.fn(), writeHead: jest.fn(), setHeader: jest.fn()};
      const mockData = 'i am image';

      AssetServer.prototype.get.mockImpl(() => Promise.resolve(mockData));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith('imgs/a.png', 'ios');
      expect(res.setHeader).toBeCalledWith('Cache-Control', 'max-age=31536000');
      expect(res.end).toBeCalledWith(mockData.slice(0, 4));
    });

    it('should serve assets files\'s name contain non-latin letter', () => {
      const req = {url: '/assets/imgs/%E4%B8%BB%E9%A1%B5/logo.png'};
      const res = {end: jest.fn(), setHeader: jest.fn()};

      AssetServer.prototype.get.mockImpl(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith(
        'imgs/\u{4E3B}\u{9875}/logo.png',
        undefined
      );
      expect(res.setHeader).toBeCalledWith('Cache-Control', 'max-age=31536000');
      expect(res.end).toBeCalledWith('i am image');
    });
  });

  describe('buildbundle(options)', () => {
    it('Calls the bundler with the correct args', () => {
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
          runBeforeMainModule: ['InitializeCore'],
          unbundle: false,
          entryModuleOnly: false,
          isolateModuleIDs: false,
          assetPlugins: [],
        })
      );
    });
  });

  describe('buildBundleFromUrl(options)', () => {
    it('Calls the bundler with the correct args', () => {
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
            runBeforeMainModule: ['InitializeCore'],
            unbundle: false,
            entryModuleOnly: false,
            isolateModuleIDs: false,
            assetPlugins: [],
          })
        );
    });
  });

  describe('/symbolicate endpoint', () => {
    it('should symbolicate given stack trace', () => {
      const body = JSON.stringify({stack: [{
        file: 'http://foo.bundle?platform=ios',
        lineNumber: 2100,
        column: 44,
        customPropShouldBeLeftUnchanged: 'foo',
      }]});

      SourceMapConsumer.prototype.originalPositionFor = jest.fn((frame) => {
        expect(frame.line).toEqual(2100);
        expect(frame.column).toEqual(44);
        return {
          source: 'foo.js',
          line: 21,
          column: 4,
        };
      });

      return makeRequest(
        requestHandler,
        '/symbolicate',
        { rawBody: body }
      ).then(response => {
        expect(JSON.parse(response.body)).toEqual({
          stack: [{
            file: 'foo.js',
            lineNumber: 21,
            column: 4,
            customPropShouldBeLeftUnchanged: 'foo',
          }]
        });
      });
    });

    it('ignores `/debuggerWorker.js` stack frames', () => {
      const body = JSON.stringify({stack: [{
        file: 'http://localhost:8081/debuggerWorker.js',
        lineNumber: 123,
        column: 456,
      }]});

      return makeRequest(
        requestHandler,
        '/symbolicate',
        { rawBody: body }
      ).then(response => {
        expect(JSON.parse(response.body)).toEqual({
          stack: [{
            file: 'http://localhost:8081/debuggerWorker.js',
            lineNumber: 123,
            column: 456,
          }]
        });
      });
    });
  });

  describe('/symbolicate handles errors', () => {
    it('should symbolicate given stack trace', () => {
      const body = 'clearly-not-json';
      console.error = jest.fn();

      return makeRequest(
        requestHandler,
        '/symbolicate',
        { rawBody: body }
      ).then(response => {
        expect(response.statusCode).toEqual(500);
        expect(JSON.parse(response.body)).toEqual({
          error: jasmine.any(String),
        });
        expect(console.error).toBeCalled();
      });
    });
  });
});
