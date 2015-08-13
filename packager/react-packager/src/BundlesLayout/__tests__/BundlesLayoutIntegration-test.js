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
  .dontMock('crypto')
  .dontMock('underscore')
  .dontMock('../index')
  .dontMock('../../lib/getAssetDataFromName')
  .dontMock('../../DependencyResolver/crawlers')
  .dontMock('../../DependencyResolver/crawlers/node')
  .dontMock('../../DependencyResolver/DependencyGraph/docblock')
  .dontMock('../../DependencyResolver/fastfs')
  .dontMock('../../DependencyResolver/replacePatterns')
  .dontMock('../../DependencyResolver')
  .dontMock('../../DependencyResolver/DependencyGraph')
  .dontMock('../../DependencyResolver/AssetModule_DEPRECATED')
  .dontMock('../../DependencyResolver/AssetModule')
  .dontMock('../../DependencyResolver/Module')
  .dontMock('../../DependencyResolver/Package')
  .dontMock('../../DependencyResolver/ModuleCache');

const Promise = require('promise');

jest.mock('fs');

describe('BundlesLayout', () => {
  var BundlesLayout;
  var Cache;
  var DependencyResolver;
  var fileWatcher;
  var fs;

  beforeEach(() => {
    fs = require('fs');
    BundlesLayout = require('../index');
    Cache = require('../../Cache');
    DependencyResolver = require('../../DependencyResolver');

    fileWatcher = {
      on: () => this,
      isWatchman: () => Promise.resolve(false)
    };
  });

  describe('generate', () => {
    const polyfills = [
      'polyfills/prelude_dev.js',
      'polyfills/prelude.js',
      'polyfills/require.js',
      'polyfills/polyfills.js',
      'polyfills/console.js',
      'polyfills/error-guard.js',
      'polyfills/String.prototype.es6.js',
      'polyfills/Array.prototype.es6.js',
    ];

    function newBundlesLayout() {
      const resolver = new DependencyResolver({
        projectRoots: ['/root'],
        fileWatcher: fileWatcher,
        cache: new Cache(),
        assetExts: ['js', 'png'],
        assetRoots: ['/root'],
      });

      return new BundlesLayout({dependencyResolver: resolver});
    }

    function modulePaths(bundles) {
      if (!bundles) {
        return null;
      }

      return bundles.map(bundle => {
        return bundle
          .filter(module => { // filter polyfills
            for (let p of polyfills) {
              if (module.id.indexOf(p) !== -1) {
                return false;
              }
            }
            return true;
          })
          .map(module => module.path);
      });
    }

    pit('should bundle dependant modules', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require("a");`,
          'a.js': `
            /**,
             * @providesModule a
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js', '/root/a.js'],
        ])
      );
    });

    pit('should split bundles for async dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js'],
        ])
      );
    });

    pit('should split into multiple bundles separate async dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);
            require.ensure(["b"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */`,
          'b.js': `
            /**
             * @providesModule b
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js'],
          ['/root/b.js'],
        ])
      );
    });

    pit('should put related async dependencies into the same bundle', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a", "b"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */`,
          'b.js': `
            /**
             * @providesModule b
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/b.js'],
        ])
      );
    });

    pit('should fully traverse sync dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require("a");
            require.ensure(["b"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */`,
          'b.js': `
            /**
             * @providesModule b
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js', '/root/a.js'],
          ['/root/b.js'],
        ])
      );
    });

    pit('should include sync dependencies async dependencies might have', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */,
            require("b");`,
          'b.js': `
            /**
             * @providesModule b
             */
            require("c");`,
          'c.js': `
            /**
             * @providesModule c
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/b.js', '/root/c.js'],
        ])
      );
    });

    pit('should allow duplicated dependencies across bundles', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);
            require.ensure(["b"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */,
            require("c");`,
          'b.js': `
            /**
             * @providesModule b
             */
            require("c");`,
          'c.js': `
            /**
             * @providesModule c
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/c.js'],
          ['/root/b.js', '/root/c.js'],
        ])
      );
    });

    pit('should put in separate bundles async dependencies of async dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */,
            require.ensure(["b"]);`,
          'b.js': `
            /**
             * @providesModule b
             */
            require("c");`,
          'c.js': `
            /**
             * @providesModule c
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js'],
          ['/root/b.js', '/root/c.js'],
        ])
      );
    });

    pit('should dedup same async bundle duplicated dependencies', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a", "b"]);`,
          'a.js': `
            /**,
             * @providesModule a
             */,
            require("c");`,
          'b.js': `
            /**
             * @providesModule b
             */
            require("c");`,
          'c.js': `
            /**
             * @providesModule c
             */`,
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/c.js', '/root/b.js'],
        ])
      );
    });

    pit('should put image dependencies into separate bundles', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);`,
          'a.js':`
            /**,
             * @providesModule a
             */,
            require("./img.png");`,
          'img.png': '',
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/img.png'],
        ])
      );
    });

    pit('should put image dependencies across bundles', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);
            require.ensure(["b"]);`,
          'a.js':`
            /**,
             * @providesModule a
             */,
            require("./img.png");`,
          'b.js':`
            /**,
             * @providesModule b
             */,
            require("./img.png");`,
          'img.png': '',
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/img.png'],
          ['/root/b.js', '/root/img.png'],
        ])
      );
    });

    pit('could async require asset', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["./img.png"]);`,
          'img.png': '',
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/img.png'],
        ])
      );
    });

    pit('should include deprecated assets into separate bundles', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["a"]);`,
          'a.js':`
            /**,
             * @providesModule a
             */,
            require("image!img");`,
          'img.png': '',
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/a.js', '/root/img.png'],
        ])
      );
    });

    pit('could async require deprecated asset', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["image!img"]);`,
          'img.png': '',
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/img.png'],
        ])
      );
    });

    pit('should put packages into bundles', () => {
      fs.__setMockFilesystem({
        'root': {
          'index.js': `
            /**
             * @providesModule index
             */
            require.ensure(["aPackage"]);`,
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: './main.js',
              browser: {
                './main.js': './client.js',
              },
            }),
            'main.js': 'some other code',
            'client.js': 'some code',
          },
        }
      });

      return newBundlesLayout().generateLayout(['/root/index.js']).then(bundles =>
        expect(modulePaths(bundles)).toEqual([
          ['/root/index.js'],
          ['/root/aPackage/client.js'],
        ])
      );
    });
  });
});
