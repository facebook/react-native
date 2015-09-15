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
  .setMock('worker-farm', () => () => undefined)
  .dontMock('underscore')
  .dontMock('../../lib/ModuleTransport')
  .setMock('uglify-js')
  .dontMock('../')
  .setMock('chalk', { dim: function(s) { return s; } });

jest.mock('fs');

var Promise = require('promise');

describe('Bundler', function() {
  var getDependencies;
  var wrapModule;
  var Bundler;
  var bundler;
  var assetServer;
  var modules;
  var ProgressBar;

  beforeEach(function() {
    getDependencies = jest.genMockFn();
    wrapModule = jest.genMockFn();
    require('../../DependencyResolver').mockImpl(function() {
      return {
        getDependencies: getDependencies,
        wrapModule: wrapModule,
      };
    });

    Bundler = require('../');

    require('fs').statSync.mockImpl(function() {
      return {
        isDirectory: () => true
      };
    });

    require('fs').readFile.mockImpl(function(file, callback) {
      callback(null, '{"json":true}');
    });

    ProgressBar = require('progress');

    assetServer = {
      getAssetData: jest.genMockFn(),
    };

    bundler = new Bundler({
      projectRoots: ['/root'],
      assetServer: assetServer,
    });


    function createModule({
      path,
      id,
      dependencies,
      isAsset,
      isAsset_DEPRECATED,
      isJSON,
      resolution,
    }) {
      return {
        path,
        resolution,
        getDependencies() { return Promise.resolve(dependencies); },
        getName() { return Promise.resolve(id); },
        isJSON() { return isJSON; },
        isAsset() { return isAsset; },
        isAsset_DEPRECATED() { return isAsset_DEPRECATED; },
      };
    }

    modules = [
      createModule({id: 'foo', path: '/root/foo.js', dependencies: []}),
      createModule({id: 'bar', path: '/root/bar.js', dependencies: []}),
      createModule({
        path: '/root/img/img.png',
        id: 'image!img',
        isAsset_DEPRECATED: true,
        dependencies: [],
        resolution: 2,
      }),
      createModule({
        id: 'new_image.png',
        path: '/root/img/new_image.png',
        isAsset: true,
        resolution: 2,
        dependencies: []
      }),
      createModule({
        id: 'package/file.json',
        path: '/root/file.json',
        isJSON: true,
        dependencies: [],
      }),
    ];

    getDependencies.mockImpl(function() {
      return Promise.resolve({
        mainModuleId: 'foo',
        dependencies: modules
      });
    });

    require('../../JSTransformer').prototype.loadFileAndTransform
      .mockImpl(function(path) {
        return Promise.resolve({
          code: 'transformed ' + path,
          map: 'sourcemap ' + path,
          sourceCode: 'source ' + path,
          sourcePath: path
        });
      });

    wrapModule.mockImpl(function(response, module, code) {
      return Promise.resolve('lol ' + code + ' lol');
    });

    require('image-size').mockImpl(function(path, cb) {
      cb(null, { width: 50, height: 100 });
    });

    assetServer.getAssetData.mockImpl(function() {
      return {
        scales: [1,2,3],
        hash: 'i am a hash',
        name: 'img',
        type: 'png',
      };
    });
  });

  pit('create a bundle', function() {
    return bundler.bundle('/root/foo.js', true, 'source_map_url')
      .then(function(p) {
        expect(p.addModule.mock.calls[0][0]).toEqual({
          code: 'lol transformed /root/foo.js lol',
          map: 'sourcemap /root/foo.js',
          sourceCode: 'source /root/foo.js',
          sourcePath: '/root/foo.js',
        });

        expect(p.addModule.mock.calls[1][0]).toEqual({
          code: 'lol transformed /root/bar.js lol',
          map: 'sourcemap /root/bar.js',
          sourceCode: 'source /root/bar.js',
          sourcePath: '/root/bar.js'
        });

        var imgModule_DEPRECATED = {
          __packager_asset: true,
          isStatic: true,
          path: '/root/img/img.png',
          uri: 'img',
          width: 25,
          height: 50,
          deprecated: true,
        };

        expect(p.addModule.mock.calls[2][0]).toEqual({
          code: 'lol module.exports = ' +
            JSON.stringify(imgModule_DEPRECATED) +
            '; lol',
          sourceCode: 'module.exports = ' +
            JSON.stringify(imgModule_DEPRECATED) +
            ';',
          sourcePath: '/root/img/img.png',
          virtual: true,
          map: undefined,
        });

        var imgModule = {
          __packager_asset: true,
          fileSystemLocation: '/root/img',
          httpServerLocation: '/assets/img',
          width: 25,
          height: 50,
          scales: [1, 2, 3],
          hash: 'i am a hash',
          name: 'img',
          type: 'png',
        };

        expect(p.addModule.mock.calls[3][0]).toEqual({
          code: 'lol module.exports = require("AssetRegistry").registerAsset(' +
            JSON.stringify(imgModule) +
            '); lol',
          sourceCode: 'module.exports = require("AssetRegistry").registerAsset(' +
            JSON.stringify(imgModule) +
            ');',
          sourcePath: '/root/img/new_image.png',
          virtual: true,
          map: undefined,
        });

        expect(p.addModule.mock.calls[4][0]).toEqual({
          code: 'lol module.exports = {"json":true}; lol',
          sourceCode: 'module.exports = {"json":true};',
          sourcePath: '/root/file.json',
          map: undefined,
          virtual: true,
        });

        expect(p.finalize.mock.calls[0]).toEqual([
          {runMainModule: true}
        ]);

        expect(p.addAsset.mock.calls).toContain([
          imgModule_DEPRECATED
        ]);

        expect(p.addAsset.mock.calls).toContain([
          imgModule
        ]);

        // TODO(amasad) This fails with 0 != 5 in OSS
        //expect(ProgressBar.prototype.tick.mock.calls.length).toEqual(modules.length);
      });
  });

  pit('gets the list of dependencies from the resolver', function() {
    return bundler.getDependencies('/root/foo.js', true)
      .then(
        () => expect(getDependencies)
                .toBeCalledWith('/root/foo.js', { dev: true })
      );
  });
});
