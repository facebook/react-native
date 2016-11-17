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

jest
  .setMock('worker-farm', () => () => undefined)
  .setMock('uglify-js')
  .mock('image-size')
  .mock('fs')
  .mock('assert')
  .mock('progress')
  .mock('../../node-haste')
  .mock('../../JSTransformer')
  .mock('../../lib/declareOpts')
  .mock('../../Resolver')
  .mock('../Bundle')
  .mock('../HMRBundle')
  .mock('../../Logger')
  .mock('../../lib/declareOpts');

var Bundler = require('../');
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
    isPolyfill,
    resolution,
  }) {
    return {
      path,
      resolution,
      getDependencies: () => Promise.resolve(dependencies),
      getName: () => Promise.resolve(id),
      isJSON: () => isJSON,
      isAsset: () => isAsset,
      isAsset_DEPRECATED: () => isAsset_DEPRECATED,
      isPolyfill: () => isPolyfill,
      read: () => ({
        code: 'arbitrary',
        source: 'arbitrary',
      }),
    };
  }

  var getDependencies;
  var getModuleSystemDependencies;
  var bundler;
  var assetServer;
  var modules;
  var projectRoots;

  beforeEach(function() {
    getDependencies = jest.fn();
    getModuleSystemDependencies = jest.fn();
    projectRoots = ['/root'];

    Resolver.mockImpl(function() {
      return {
        getDependencies: getDependencies,
        getModuleSystemDependencies: getModuleSystemDependencies,
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
      getAssetData: jest.fn(),
    };

    bundler = new Bundler({
      projectRoots,
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

    getDependencies.mockImpl((main, options, transformOptions) =>
      Promise.resolve({
        mainModuleId: 'foo',
        dependencies: modules,
        transformOptions,
        getModuleId: () => 123,
        getResolvedDependencyPairs: () => [],
      })
    );

    getModuleSystemDependencies.mockImpl(function() {
      return [];
    });

    sizeOf.mockImpl(function(path, cb) {
      cb(null, { width: 50, height: 100 });
    });
  });

  it('create a bundle', function() {
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
    }).then(bundle => {
        const ithAddedModule = (i) => bundle.addModule.mock.calls[i][2].path;

        expect(ithAddedModule(0)).toEqual('/root/foo.js');
        expect(ithAddedModule(1)).toEqual('/root/bar.js');
        expect(ithAddedModule(2)).toEqual('/root/img/img.png');
        expect(ithAddedModule(3)).toEqual('/root/img/new_image.png');
        expect(ithAddedModule(4)).toEqual('/root/file.json');

        expect(bundle.finalize.mock.calls[0]).toEqual([{
            runMainModule: true,
            runBeforeMainModule: [],
            allowUpdates: false,
        }]);

        expect(bundle.addAsset.mock.calls[0]).toEqual([{
          __packager_asset: true,
          path: '/root/img/img.png',
          uri: 'img',
          width: 25,
          height: 50,
          deprecated: true,
        }]);

        expect(bundle.addAsset.mock.calls[1]).toEqual([{
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
        }]);

        // TODO(amasad) This fails with 0 != 5 in OSS
        //expect(ProgressBar.prototype.tick.mock.calls.length).toEqual(modules.length);
      });
  });

  it('loads and runs asset plugins', function() {
    jest.mock('mockPlugin1', () => {
      return asset => {
        asset.extraReverseHash = asset.hash.split('').reverse().join('');
        return asset;
      };
    }, {virtual: true});

    jest.mock('asyncMockPlugin2', () => {
      return asset => {
        expect(asset.extraReverseHash).toBeDefined();
        return new Promise((resolve) => {
          asset.extraPixelCount = asset.width * asset.height;
          resolve(asset);
        });
      };
    }, {virtual: true});

    const mockAsset = {
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
    assetServer.getAssetData.mockImpl(() => mockAsset);

    return bundler.bundle({
      entryFile: '/root/foo.js',
      runBeforeMainModule: [],
      runModule: true,
      sourceMapUrl: 'source_map_url',
      assetPlugins: ['mockPlugin1', 'asyncMockPlugin2'],
    }).then(bundle => {
      expect(bundle.addAsset.mock.calls[1]).toEqual([{
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
        extraReverseHash: 'hsah a ma i',
        extraPixelCount: 1250,
      }]);
    });
  });

  pit('gets the list of dependencies from the resolver', function() {
    const entryFile = '/root/foo.js';
    return bundler.getDependencies({entryFile, recursive: true}).then(() =>
      // jest calledWith does not support jasmine.any
      expect(getDependencies.mock.calls[0].slice(0, -2)).toEqual([
        '/root/foo.js',
        { dev: true, recursive: true },
        { minify: false,
          dev: true,
          transform: {
            dev: true,
            hot: false,
            generateSourceMaps: false,
            projectRoots,
          }
        },
      ])
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
