/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.setMock('worker-farm', function() { return function() {}; })
    .dontMock('os')
    .dontMock('path')
    .dontMock('url')
    .setMock('timers', {
      setImmediate: function(fn) {
        return setTimeout(fn, 0);
      }
    })
    .setMock('uglify-js')
    .dontMock('../');

var Promise = require('bluebird');

describe('processRequest', function() {
  var server;
  var Packager;
  var FileWatcher;

  var options = {
     projectRoots: ['root'],
     blacklistRE: null,
     cacheVersion: null,
     polyfillModuleNames: null
  };

  var makeRequest = function(requestHandler, requrl) {
    return new Promise(function(resolve) {
      requestHandler(
        { url: requrl },
        {
          end: function(res) {
            resolve(res);
          }
        },
        {
          next: function() {}
        }
      );
    });
  };

  var invalidatorFunc = jest.genMockFunction();
  var watcherFunc = jest.genMockFunction();
  var requestHandler;
  var triggerFileChange;

  beforeEach(function() {
    Packager = require('../../Packager');
    FileWatcher = require('../../FileWatcher');

    Packager.prototype.package = jest.genMockFunction().mockImpl(function() {
      return Promise.resolve({
        getSource: function() {
          return 'this is the source';
        },
        getSourceMap: function() {
          return 'this is the source map';
        },
      });
    });


    FileWatcher.prototype.on = function(eventType, callback) {
      if (eventType !== 'all') {
        throw new Error('Can only handle "all" event in watcher.');
      }
      watcherFunc.apply(this, arguments);
      triggerFileChange = callback;
      return this;
    };

    Packager.prototype.invalidateFile = invalidatorFunc;

    var Server = require('../');
    server = new Server(options);
    requestHandler = server.processRequest.bind(server);
  });

  pit('returns JS bundle source on request of *.bundle',function() {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(function(response) {
      expect(response).toEqual('this is the source');
    });
  });

  pit('returns JS bundle source on request of *.bundle (compat)',function() {
    return makeRequest(
      requestHandler,
      'mybundle.runModule.bundle'
    ).then(function(response) {
      expect(response).toEqual('this is the source');
    });
  });

  pit('returns sourcemap on request of *.map', function() {
    return makeRequest(
      requestHandler,
      'mybundle.map?runModule=true'
    ).then(function(response) {
      expect(response).toEqual('"this is the source map"');
    });
  });

  pit('works with .ios.js extension', function() {
    return makeRequest(
      requestHandler,
      'index.ios.includeRequire.bundle'
    ).then(function(response) {
      expect(response).toEqual('this is the source');
      expect(Packager.prototype.package).toBeCalledWith(
        'index.ios.js',
        true,
        'index.ios.includeRequire.map',
        true
      );
    });
  });

  pit('watches all files in projectRoot', function() {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(function() {
      expect(watcherFunc.mock.calls[0][0]).toEqual('all');
      expect(watcherFunc.mock.calls[0][1]).not.toBe(null);
    });
  });


  describe('file changes', function() {
    pit('invalides files in package when file is updated', function() {
      return makeRequest(
        requestHandler,
        'mybundle.bundle?runModule=true'
      ).then(function() {
        var onFileChange = watcherFunc.mock.calls[0][1];
        onFileChange('all','path/file.js', options.projectRoots[0]);
        expect(invalidatorFunc.mock.calls[0][0]).toEqual('root/path/file.js');
      });
    });

    pit('rebuilds the packages that contain a file when that file is changed', function() {
      var packageFunc = jest.genMockFunction();
      packageFunc
        .mockReturnValueOnce(
          Promise.resolve({
            getSource: function() {
              return 'this is the first source';
            },
            getSourceMap: function() {},
          })
        )
        .mockReturnValue(
          Promise.resolve({
            getSource: function() {
              return 'this is the rebuilt source';
            },
            getSourceMap: function() {},
          })
        );

      Packager.prototype.package = packageFunc;

      var Server = require('../../Server');
      server = new Server(options);

      requestHandler = server.processRequest.bind(server);


      return makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .then(function(response) {
          expect(response).toEqual('this is the first source');
          expect(packageFunc.mock.calls.length).toBe(1);
          triggerFileChange('all','path/file.js', options.projectRoots[0]);
          jest.runAllTimers();
          jest.runAllTimers();
        })
        .then(function() {
          expect(packageFunc.mock.calls.length).toBe(2);
          return makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
            .then(function(response) {
              expect(response).toEqual('this is the rebuilt source');
            });
        });
    });
  });

  describe('/onchange endpoint', function() {
    var EventEmitter;
    var req;
    var res;

    beforeEach(function() {
      EventEmitter = require.requireActual('events').EventEmitter;
      req = new EventEmitter();
      req.url = '/onchange';
      res = {
        writeHead: jest.genMockFn(),
        end: jest.genMockFn()
      };
    });

    it('should hold on to request and inform on change', function() {
      server.processRequest(req, res);
      triggerFileChange('all', 'path/file.js', options.projectRoots[0]);
      jest.runAllTimers();
      expect(res.end).toBeCalledWith(JSON.stringify({changed: true}));
    });

    it('should not inform changes on disconnected clients', function() {
      server.processRequest(req, res);
      req.emit('close');
      jest.runAllTimers();
      triggerFileChange('all', 'path/file.js', options.projectRoots[0]);
      jest.runAllTimers();
      expect(res.end).not.toBeCalled();
    });
  });
});
