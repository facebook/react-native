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
  .dontMock('../');

jest.mock('fs');

var Bundler = require('../');
var JSTransformer = require('../../JSTransformer');
var Resolver = require('../../Resolver');
var sizeOf = require('image-size');
var fs = require('fs');

describe('Bundler', function() {

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

  var getDependencies;
  var wrapModule;
  var bundler;
  var assetServer;
  var modules;

  beforeEach(function() {
    getDependencies = jest.genMockFn();
    wrapModule = jest.genMockFn();
    Resolver.mockImpl(function() {
      return {
        getDependencies: getDependencies,
        wrapModule: wrapModule,
      };
    });

    fs.statSync.mockImpl(function() {
      return {
        isDirectory: () => true
      };
    });

    fs.readFile.mockImpl(function(file, callback) {
      callback(null, '{"json":true}');
    });

    assetServer = {
      getAssetData: jest.genMockFn(),
    };

    bundler = new Bundler({
      projectRoots: ['/root'],
      assetServer: assetServer,
    });

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

    JSTransformer.prototype.loadFileAndTransform
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

    sizeOf.mockImpl(function(path, cb) {
      cb(null, { width: 50, height: 100 });
    });
  });

  pit('create a bundle', function() {
    assetServer.getAssetData.mockImpl(() => {
      return {
        scales: [1,2,3],
        files: [
          '/root/img/img.png',
          '/root/img/img@2x.png',
          '/root/img/img@3x.png',
        ],
        hash: 'i am a hash',
        name: 'img',
        type: 'png',
      };
    });

    return bundler.bundle({
      entryFile: '/root/foo.js',
      runBeforeMainModule: [],
      runModule: true,
      sourceMapUrl: 'source_map_url',
    }).then(function(p) {
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
          files: [
            '/root/img/img.png',
            '/root/img/img@2x.png',
            '/root/img/img@3x.png',
          ],
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
          {runMainModule: true, runBeforeMainModule: []}
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

  describe('getOrderedDependencyPaths', () => {
    beforeEach(() => {
      assetServer.getAssetData.mockImpl(function(relPath) {
        if (relPath === 'img/new_image.png') {
          return {
            scales: [1,2,3],
            files: [
              '/root/img/new_image.png',
              '/root/img/new_image@2x.png',
              '/root/img/new_image@3x.png',
            ],
            hash: 'i am a hash',
            name: 'img',
            type: 'png',
          };
        } else if (relPath === 'img/new_image2.png') {
          return {
            scales: [1,2,3],
            files: [
              '/root/img/new_image2.png',
              '/root/img/new_image2@2x.png',
              '/root/img/new_image2@3x.png',
            ],
            hash: 'i am a hash',
            name: 'img',
            type: 'png',
          };
        }

        throw new Error('unknown image ' + relPath);
      });
    });

    pit('should get the concrete list of all dependency files', () => {
      modules.push(
        createModule({
          id: 'new_image2.png',
          path: '/root/img/new_image2.png',
          isAsset: true,
          resolution: 2,
          dependencies: []
        }),
      );

      return bundler.getOrderedDependencyPaths('/root/foo.js', true)
        .then((paths) => expect(paths).toEqual([
          '/root/foo.js',
          '/root/bar.js',
          '/root/img/img.png',
          '/root/img/new_image.png',
          '/root/img/new_image@2x.png',
          '/root/img/new_image@3x.png',
          '/root/file.json',
          '/root/img/new_image2.png',
          '/root/img/new_image2@2x.png',
          '/root/img/new_image2@3x.png',
        ]));
    });
  });
});
