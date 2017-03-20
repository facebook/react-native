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

jest.mock('worker-farm', () => () => () => {})
    .mock('timers', () => ({setImmediate: fn => setTimeout(fn, 0)}))
    .mock('uglify-js')
    .mock('crypto')
    .mock(
      '../symbolicate',
      () => ({createWorker: jest.fn().mockReturnValue(jest.fn())}),
    )
    .mock('../../Bundler')
    .mock('../../AssetServer')
    .mock('../../lib/declareOpts')
    .mock('../../node-haste')
    .mock('../../Logger')
    .mock('../../lib/GlobalTransformCache');

describe('processRequest', () => {
  let Bundler, Server, AssetServer, Promise, symbolicate;
  beforeEach(() => {
    jest.resetModules();
    Bundler = require('../../Bundler');
    Server = require('../');
    AssetServer = require('../../AssetServer');
    Promise = require('promise');
    symbolicate = require('../symbolicate');
  });

  let server;

  const options = {
    projectRoots: ['root'],
    blacklistRE: null,
    cacheVersion: null,
    polyfillModuleNames: null,
    reporter: require('../../lib/reporting').nullReporter,
  };

  const makeRequest = (reqHandler, requrl, reqOptions) => new Promise(resolve =>
    reqHandler(
      {url: requrl, headers:{}, ...reqOptions},
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
      {next: () => {}},
    )
  );

  const invalidatorFunc = jest.fn();
  let requestHandler;

  beforeEach(() => {
    Bundler.prototype.bundle = jest.fn(() =>
      Promise.resolve({
        getModules: () => [],
        getSource: () => 'this is the source',
        getSourceMap: () => ({version: 3}),
        getSourceMapString: () => 'this is the source map',
        getEtag: () => 'this is an etag',
      }));

    Bundler.prototype.invalidateFile = invalidatorFunc;
    Bundler.prototype.getResolver =
      jest.fn().mockReturnValue(Promise.resolve({
        getDependencyGraph: jest.fn().mockReturnValue({
          getHasteMap: jest.fn().mockReturnValue({on: jest.fn()}),
          load: jest.fn(() => Promise.resolve()),
        }),
      }));

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
      {headers : {'if-none-match' : 'this is an etag'}}
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
        assetPlugins: [],
        dev: true,
        entryFile: 'index.ios.js',
        entryModuleOnly: false,
        generateSourceMaps: false,
        hot: false,
        inlineSourceMap: false,
        isolateModuleIDs: false,
        minify: false,
        onProgress: jasmine.any(Function),
        platform: undefined,
        resolutionResponse: null,
        runBeforeMainModule: ['InitializeCore'],
        runModule: true,
        sourceMapUrl: 'index.ios.includeRequire.map',
        unbundle: false,
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
        assetPlugins: [],
        dev: true,
        entryFile: 'index.js',
        entryModuleOnly: false,
        generateSourceMaps: false,
        hot: false,
        inlineSourceMap: false,
        isolateModuleIDs: false,
        minify: false,
        onProgress: jasmine.any(Function),
        platform: 'ios',
        resolutionResponse: null,
        runBeforeMainModule: ['InitializeCore'],
        runModule: true,
        sourceMapUrl: 'index.map?platform=ios',
        unbundle: false,
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
        assetPlugins: ['assetPlugin1', 'assetPlugin2'],
        dev: true,
        entryFile: 'index.js',
        entryModuleOnly: false,
        generateSourceMaps: false,
        hot: false,
        inlineSourceMap: false,
        isolateModuleIDs: false,
        minify: false,
        onProgress: jasmine.any(Function),
        platform: undefined,
        resolutionResponse: null,
        runBeforeMainModule: ['InitializeCore'],
        runModule: true,
        sourceMapUrl: 'index.map?assetPlugin=assetPlugin1&assetPlugin=assetPlugin2',
        unbundle: false,
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
            getModules: () => [],
            getSource: () => 'this is the first source',
            getSourceMap: () => {},
            getSourceMapString: () => 'this is the source map',
            getEtag: () => () => 'this is an etag',
          })
        )
        .mockReturnValue(
          Promise.resolve({
            getModules: () => [],
            getSource: () => 'this is the rebuilt source',
            getSourceMap: () => {},
            getSourceMapString: () => 'this is the source map',
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
              getModules: () => [],
              getSource: () => 'this is the first source',
              getSourceMap: () => {},
              getSourceMapString: () => 'this is the source map',
              getEtag: () => () => 'this is an etag',
            })
          )
          .mockReturnValue(
            Promise.resolve({
              getModules: () => [],
              getSource: () => 'this is the rebuilt source',
              getSourceMap: () => {},
              getSourceMapString: () => 'this is the source map',
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
      req = scaffoldReq(new EventEmitter());
      req.url = '/onchange';
      res = {
        writeHead: jest.fn(),
        end: jest.fn(),
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
      const req = scaffoldReq({url: '/assets/imgs/a.png'});
      const res = {end: jest.fn(), setHeader: jest.fn()};

      AssetServer.prototype.get.mockImplementation(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(res.end).toBeCalledWith('i am image');
    });

    it('should parse the platform option', () => {
      const req = scaffoldReq({url: '/assets/imgs/a.png?platform=ios'});
      const res = {end: jest.fn(), setHeader: jest.fn()};

      AssetServer.prototype.get.mockImplementation(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith('imgs/a.png', 'ios');
      expect(res.end).toBeCalledWith('i am image');
    });

    it('should serve range request', () => {
      const req = scaffoldReq({
        url: '/assets/imgs/a.png?platform=ios',
        headers: {range: 'bytes=0-3'},
      });
      const res = {end: jest.fn(), writeHead: jest.fn(), setHeader: jest.fn()};
      const mockData = 'i am image';

      AssetServer.prototype.get.mockImplementation(() => Promise.resolve(mockData));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith('imgs/a.png', 'ios');
      expect(res.end).toBeCalledWith(mockData.slice(0, 4));
    });

    it('should serve assets files\'s name contain non-latin letter', () => {
      const req = scaffoldReq({url: '/assets/imgs/%E4%B8%BB%E9%A1%B5/logo.png'});
      const res = {end: jest.fn(), setHeader: jest.fn()};

      AssetServer.prototype.get.mockImplementation(() => Promise.resolve('i am image'));

      server.processRequest(req, res);
      jest.runAllTimers();
      expect(AssetServer.prototype.get).toBeCalledWith(
        'imgs/\u{4E3B}\u{9875}/logo.png',
        undefined
      );
      expect(res.end).toBeCalledWith('i am image');
    });
  });

  describe('buildbundle(options)', () => {
    it('Calls the bundler with the correct args', () => {
      return server.buildBundle({
        ...Server.DEFAULT_BUNDLE_OPTIONS,
        entryFile: 'foo file',
      }).then(() =>
        expect(Bundler.prototype.bundle).toBeCalledWith({
          assetPlugins: [],
          dev: true,
          entryFile: 'foo file',
          entryModuleOnly: false,
          generateSourceMaps: false,
          hot: false,
          inlineSourceMap: false,
          isolateModuleIDs: false,
          minify: false,
          onProgress: null,
          platform: undefined,
          resolutionResponse: null,
          runBeforeMainModule: ['InitializeCore'],
          runModule: true,
          sourceMapUrl: null,
          unbundle: false,
        })
      );
    });
  });

  describe('buildBundleFromUrl(options)', () => {
    it('Calls the bundler with the correct args', () => {
      return server.buildBundleFromUrl('/path/to/foo.bundle?dev=false&runModule=false')
        .then(() =>
          expect(Bundler.prototype.bundle).toBeCalledWith({
            assetPlugins: [],
            dev: false,
            entryFile: 'path/to/foo.js',
            entryModuleOnly: false,
            generateSourceMaps: true,
            hot: false,
            inlineSourceMap: false,
            isolateModuleIDs: false,
            minify: false,
            onProgress: null,
            platform: undefined,
            resolutionResponse: null,
            runBeforeMainModule: ['InitializeCore'],
            runModule: false,
            sourceMapUrl: '/path/to/foo.map?dev=false&runModule=false',
            unbundle: false,
          })
        );
    });
  });

  describe('/symbolicate endpoint', () => {
    let symbolicationWorker;
    beforeEach(() => {
      symbolicationWorker = symbolicate.createWorker();
      symbolicationWorker.mockReset();
    });

    it('should symbolicate given stack trace', () => {
      const inputStack = [{
        file: 'http://foo.bundle?platform=ios',
        lineNumber: 2100,
        column: 44,
        customPropShouldBeLeftUnchanged: 'foo',
      }];
      const outputStack = [{
        source: 'foo.js',
        line: 21,
        column: 4,
      }];
      const body = JSON.stringify({stack: inputStack});

      expect.assertions(2);
      symbolicationWorker.mockImplementation(stack => {
        expect(stack).toEqual(inputStack);
        return outputStack;
      });

      return makeRequest(
        requestHandler,
        '/symbolicate',
        {rawBody: body},
      ).then(response =>
        expect(JSON.parse(response.body)).toEqual({stack: outputStack}));
    });
  });

  describe('/symbolicate handles errors', () => {
    it('should symbolicate given stack trace', () => {
      const body = 'clearly-not-json';
      console.error = jest.fn();

      return makeRequest(
        requestHandler,
        '/symbolicate',
        {rawBody: body}
      ).then(response => {
        expect(response.statusCode).toEqual(500);
        expect(JSON.parse(response.body)).toEqual({
          error: jasmine.any(String),
        });
        expect(console.error).toBeCalled();
      });
    });
  });

  describe('_getOptionsFromUrl', () => {
    it('ignores protocol, host and port of the passed in URL', () => {
      const short = '/path/to/entry-file.js??platform=ios&dev=true&minify=false';
      const long = `http://localhost:8081${short}`;
      expect(server._getOptionsFromUrl(long))
        .toEqual(server._getOptionsFromUrl(short));
    });
  });

  // ensures that vital properties exist on fake request objects
  function scaffoldReq(req) {
    if (!req.headers) {
      req.headers = {};
    }
    return req;
  }
});
