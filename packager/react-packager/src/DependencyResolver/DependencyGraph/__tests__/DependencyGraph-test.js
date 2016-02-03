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

jest.mock('fs');

const Promise = require('promise');
const DependencyGraph = require('../index');
const fs = require('graceful-fs');

const mocksPattern = /(?:[\\/]|^)__mocks__[\\/]([^\/]+)\.js$/;

describe('DependencyGraph', function() {
  let defaults;

  function getOrderedDependenciesAsJSON(dgraph, entry, platform, recursive = true) {
    return dgraph.getDependencies(entry, platform, recursive)
      .then(response => response.finalize())
      .then(({ dependencies }) => Promise.all(dependencies.map(dep => Promise.all([
        dep.getName(),
        dep.getDependencies(),
      ]).then(([name, moduleDependencies]) => ({
        path: dep.path,
        isJSON: dep.isJSON(),
        isAsset: dep.isAsset(),
        isAsset_DEPRECATED: dep.isAsset_DEPRECATED(),
        isPolyfill: dep.isPolyfill(),
        resolution: dep.resolution,
        id: name,
        dependencies: moduleDependencies,
      })))
    ));
  }

  beforeEach(function() {
    const fileWatcher = {
      on: function() {
        return this;
      },
      isWatchman: () => Promise.resolve(false),
    };

    const Cache = jest.genMockFn();
    Cache.prototype.get = jest.genMockFn().mockImplementation(
      (filepath, field, cb) => cb(filepath)
    );
    Cache.prototype.invalidate = jest.genMockFn();
    Cache.prototype.end = jest.genMockFn();

    defaults = {
      assetExts: ['png', 'jpg'],
      cache: new Cache(),
      fileWatcher,
      providesModuleNodeModules: [
        'haste-fbjs',
        'react-haste',
        'react-native',
        // Parse requires AsyncStorage. They will
        // change that to require('react-native') which
        // should work after this release and we can
        // remove it from here.
        'parse',
      ],
      platforms: ['ios', 'android'],
      shouldThrowOnUnresolvedErrors: () => false,
    };
  });

  describe('get sync dependencies', function() {
    pit('should get dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")',
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
            'require("b")',
          ].join('\n'),
          'b.js': [
            '/**',
            ' * @providesModule b',
            ' */',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'a',
              path: '/root/a.js',
              dependencies: ['b'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'b',
              path: '/root/b.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);
      });
    });

    pit('should get shallow dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")',
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
            'require("b")',
          ].join('\n'),
          'b.js': [
            '/**',
            ' * @providesModule b',
            ' */',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js', null, false).then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'a',
              path: '/root/a.js',
              dependencies: ['b'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should get dependencies with the correct extensions', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")',
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
          ].join('\n'),
          'a.js.orig': [
            '/**',
            ' * @providesModule a',
            ' */',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'a',
              path: '/root/a.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should get json dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'package.json': JSON.stringify({
            name: 'package',
          }),
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./a.json")',
            'require("./b")',
          ].join('\n'),
          'a.json': JSON.stringify({}),
          'b.json': JSON.stringify({}),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['./a.json', './b'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'package/a.json',
              isJSON: true,
              path: '/root/a.json',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'package/b.json',
              isJSON: true,
              path: '/root/b.json',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should get package json as a dep', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'package.json': JSON.stringify({
            name: 'package',
          }),
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./package.json")',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(deps => {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['./package.json'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'package/package.json',
              isJSON: true,
              path: '/root/package.json',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should get dependencies with deprecated assets', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("image!a")',
          ].join('\n'),
          'imgs': {
            'a.png': '',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        assetRoots_DEPRECATED: ['/root/imgs'],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['image!a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'image!a',
              path: '/root/imgs/a.png',
              dependencies: [],
              isAsset_DEPRECATED: true,
              resolution: 1,
              isAsset: false,
              isJSON: false,
              isPolyfill: false,
            },
          ]);
      });
    });

    pit('should get dependencies with relative assets', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./imgs/a.png")',
          ].join('\n'),
          'imgs': {
            'a.png': '',
          },
          'package.json': JSON.stringify({
            name: 'rootPackage',
          }),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['./imgs/a.png'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'rootPackage/imgs/a.png',
              path: '/root/imgs/a.png',
              dependencies: [],
              isAsset: true,
              resolution: 1,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
          ]);
      });
    });

    pit('should get dependencies with assets and resolution', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./imgs/a.png");',
            'require("./imgs/b.png");',
            'require("./imgs/c.png");',
          ].join('\n'),
          'imgs': {
            'a@1.5x.png': '',
            'b@.7x.png': '',
            'c.png': '',
            'c@2x.png': '',
          },
          'package.json': JSON.stringify({
            name: 'rootPackage',
          }),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: [
                './imgs/a.png',
                './imgs/b.png',
                './imgs/c.png',
              ],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'rootPackage/imgs/a.png',
              path: '/root/imgs/a@1.5x.png',
              resolution: 1.5,
              dependencies: [],
              isAsset: true,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
            {
              id: 'rootPackage/imgs/b.png',
              path: '/root/imgs/b@.7x.png',
              resolution: 0.7,
              dependencies: [],
              isAsset: true,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
            {
              id: 'rootPackage/imgs/c.png',
              path: '/root/imgs/c.png',
              resolution: 1,
              dependencies: [],
              isAsset: true,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
          ]);
      });
    });

    pit('should respect platform extension in assets', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./imgs/a.png");',
            'require("./imgs/b.png");',
            'require("./imgs/c.png");',
          ].join('\n'),
          'imgs': {
            'a@1.5x.ios.png': '',
            'b@.7x.ios.png': '',
            'c.ios.png': '',
            'c@2x.ios.png': '',
          },
          'package.json': JSON.stringify({
            name: 'rootPackage',
          }),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });

      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js', 'ios').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: [
                './imgs/a.png',
                './imgs/b.png',
                './imgs/c.png',
              ],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'rootPackage/imgs/a.png',
              path: '/root/imgs/a@1.5x.ios.png',
              resolution: 1.5,
              dependencies: [],
              isAsset: true,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
            {
              id: 'rootPackage/imgs/b.png',
              path: '/root/imgs/b@.7x.ios.png',
              resolution: 0.7,
              dependencies: [],
              isAsset: true,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
            {
              id: 'rootPackage/imgs/c.png',
              path: '/root/imgs/c.ios.png',
              resolution: 1,
              dependencies: [],
              isAsset: true,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
          ]);
      });
    });

    pit('Deprecated and relative assets can live together', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./imgs/a.png")',
            'require("image!a")',
          ].join('\n'),
          'imgs': {
            'a.png': '',
          },
          'package.json': JSON.stringify({
            name: 'rootPackage',
          }),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        assetRoots_DEPRECATED: ['/root/imgs'],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['./imgs/a.png', 'image!a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'rootPackage/imgs/a.png',
              path: '/root/imgs/a.png',
              dependencies: [],
              isAsset: true,
              resolution: 1,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
            },
            {
              id: 'image!a',
              path: '/root/imgs/a.png',
              dependencies: [],
              isAsset_DEPRECATED: true,
              resolution: 1,
              isAsset: false,
              isJSON: false,
              isPolyfill: false,
            },
          ]);
      });
    });

    pit('should get recursive dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")',
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
            'require("index")',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'a',
              path: '/root/a.js',
              dependencies: ['index'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should work with packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['aPackage'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'aPackage/main.js',
              path: '/root/aPackage/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should work with packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage/")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['aPackage/'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'aPackage/main.js',
              path: '/root/aPackage/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should work with packages with a dot in the name', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("sha.js")',
            'require("x.y.z")',
          ].join('\n'),
          'sha.js': {
            'package.json': JSON.stringify({
              name: 'sha.js',
              main: 'main.js',
            }),
            'main.js': 'lol',
          },
          'x.y.z': {
            'package.json': JSON.stringify({
              name: 'x.y.z',
              main: 'main.js',
            }),
            'main.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['sha.js', 'x.y.z'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'sha.js/main.js',
              path: '/root/sha.js/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'x.y.z/main.js',
              path: '/root/x.y.z/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should default main package to index.js', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require("aPackage")',
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
            }),
            'index.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'aPackage/index.js',
              path: '/root/aPackage/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should resolve using alternative ids', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require("aPackage")',
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
            }),
            'index.js': [
              '/**',
              ' * @providesModule EpicModule',
              ' */',
            ].join('\n'),
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'EpicModule',
              path: '/root/aPackage/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should default use index.js if main is a dir', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': 'require("aPackage")',
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'lib',
            }),
            lib: {
              'index.js': 'lol',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: '/root/index.js',
              path: '/root/index.js',
              dependencies: ['aPackage'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'aPackage/lib/index.js',
              path: '/root/aPackage/lib/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should resolve require to index if it is a dir', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'package.json': JSON.stringify({
            name: 'test',
          }),
          'index.js': 'require("./lib/")',
          lib: {
            'index.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'test/index.js',
              path: '/root/index.js',
              dependencies: ['./lib/'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'test/lib/index.js',
              path: '/root/lib/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should resolve require to main if it is a dir w/ a package.json', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'package.json': JSON.stringify({
            name: 'test',
          }),
          'index.js': 'require("./lib/")',
          lib: {
            'package.json': JSON.stringify({
              'main': 'main.js',
            }),
            'index.js': 'lol',
            'main.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'test/index.js',
              path: '/root/index.js',
              dependencies: ['./lib/'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: '/root/lib/main.js',
              path: '/root/lib/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should ignore malformed packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
          ].join('\n'),
          'aPackage': {
            'package.json': 'lol',
            'main.js': 'lol',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should fatal on multiple modules with the same name', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
          ].join('\n'),
          'b.js': [
            '/**',
            ' * @providesModule index',
            ' */',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });

      return dgraph.load().catch(err => {
        expect(err.message).toEqual('Failed to build DependencyGraph: Naming collision detected: /root/b.js collides with /root/index.js');
        expect(err.type).toEqual('DependencyGraphError');
      });
    });

    pit('should be forgiving with missing requires', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("lolomg")',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['lolomg'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);
      });
    });

    pit('should work with packages with subdirs', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage/subdir/lolynot")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'lol',
            'subdir': {
              'lolynot.js': 'lolynot',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['aPackage/subdir/lolynot'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'aPackage/subdir/lolynot.js',
              path: '/root/aPackage/subdir/lolynot.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);
      });
    });

    pit('should work with packages with symlinked subdirs', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'symlinkedPackage': {
          'package.json': JSON.stringify({
            name: 'aPackage',
            main: 'main.js',
          }),
          'main.js': 'lol',
          'subdir': {
            'lolynot.js': 'lolynot',
          },
        },
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage/subdir/lolynot")',
          ].join('\n'),
          'aPackage': { SYMLINK: '/symlinkedPackage' },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['aPackage/subdir/lolynot'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'aPackage/subdir/lolynot.js',
              path: '/root/aPackage/subdir/lolynot.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);
      });
    });

    pit('should work with relative modules in packages', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'require("./subdir/lolynot")',
            'subdir': {
              'lolynot.js': 'require("../other")',
            },
            'other.js': 'some code',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['aPackage'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'aPackage/main.js',
              path: '/root/aPackage/main.js',
              dependencies: ['./subdir/lolynot'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'aPackage/subdir/lolynot.js',
              path: '/root/aPackage/subdir/lolynot.js',
              dependencies: ['../other'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'aPackage/other.js',
              path: '/root/aPackage/other.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);
      });
    });

    testBrowserField('browser');
    testBrowserField('react-native');

    function replaceBrowserField(json, fieldName) {
      if (fieldName !== 'browser') {
        json[fieldName] = json.browser;
        delete json.browser;
      }

      return json;
    }

    function testBrowserField(fieldName) {
      pit('should support simple browser field in packages ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                main: 'main.js',
                browser: 'client.js',
              }, fieldName)),
              'main.js': 'some other code',
              'client.js': 'some code',
            },
          },
        });

        var dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'aPackage/client.js',
                path: '/root/aPackage/client.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });

      pit('should support browser field in packages w/o .js ext ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                main: 'main.js',
                browser: 'client',
              }, fieldName)),
              'main.js': 'some other code',
              'client.js': 'some code',
            },
          },
        });

        var dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/client.js',
                path: '/root/aPackage/client.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });

      pit('should support mapping main in browser field json ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                main: './main.js',
                browser: {
                  './main.js': './client.js',
                },
              }, fieldName)),
              'main.js': 'some other code',
              'client.js': 'some code',
            },
          },
        });

        var dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
          assetExts: ['png', 'jpg'],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/client.js',
                path: '/root/aPackage/client.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });

      pit('should work do correct browser mapping w/o js ext ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                main: './main.js',
                browser: {
                  './main': './client.js',
                },
              }, fieldName)),
              'main.js': 'some other code',
              'client.js': 'some code',
            },
          },
        });

        var dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
          assetExts: ['png', 'jpg'],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'aPackage/client.js',
                path: '/root/aPackage/client.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });

      pit('should support browser mapping of files ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                main: './main.js',
                browser: {
                  './main': './client.js',
                  './node.js': './not-node.js',
                  './not-browser': './browser.js',
                  './dir/server.js': './dir/client',
                  './hello.js': './bye.js',
                },
              }, fieldName)),
              'main.js': 'some other code',
              'client.js': 'require("./node")\nrequire("./dir/server.js")',
              'not-node.js': 'require("./not-browser")',
              'not-browser.js': 'require("./dir/server")',
              'browser.js': 'some browser code',
              'dir': {
                'server.js': 'some node code',
                'client.js': 'require("../hello")',
              },
              'hello.js': 'hello',
              'bye.js': 'bye',
            },
          },
        });

        const dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              { id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/client.js',
                path: '/root/aPackage/client.js',
                dependencies: ['./node', './dir/server.js'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/not-node.js',
                path: '/root/aPackage/not-node.js',
                dependencies: ['./not-browser'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/browser.js',
                path: '/root/aPackage/browser.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/dir/client.js',
                path: '/root/aPackage/dir/client.js',
                dependencies: ['../hello'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/bye.js',
                path: '/root/aPackage/bye.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });

      pit('should support browser mapping for packages ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                browser: {
                  'node-package': 'browser-package',
                },
              }, fieldName)),
              'index.js': 'require("node-package")',
              'node-package': {
                'package.json': JSON.stringify({
                  'name': 'node-package',
                }),
                'index.js': 'some node code',
              },
              'browser-package': {
                'package.json': JSON.stringify({
                  'name': 'browser-package',
                }),
                'index.js': 'some browser code',
              },
            },
          },
        });

        var dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              { id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/index.js',
                path: '/root/aPackage/index.js',
                dependencies: ['node-package'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'browser-package/index.js',
                path: '/root/aPackage/browser-package/index.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });

      pit('should support browser mapping of a package to a file ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                browser: {
                  'node-package': './dir/browser.js',
                },
              }, fieldName)),
              'index.js': 'require("./dir/ooga")',
              'dir': {
                'ooga.js': 'require("node-package")',
                'browser.js': 'some browser code',
              },
              'node-package': {
                'package.json': JSON.stringify({
                  'name': 'node-package',
                }),
                'index.js': 'some node code',
              },
            },
          },
        });

        const dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              { id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/index.js',
                path: '/root/aPackage/index.js',
                dependencies: ['./dir/ooga'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/dir/ooga.js',
                path: '/root/aPackage/dir/ooga.js',
                dependencies: ['node-package'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/dir/browser.js',
                path: '/root/aPackage/dir/browser.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });

      pit('should support browser mapping for packages ("' + fieldName + '")', function() {
        var root = '/root';
        fs.__setMockFilesystem({
          'root': {
            'index.js': [
              '/**',
              ' * @providesModule index',
              ' */',
              'require("aPackage")',
            ].join('\n'),
            'aPackage': {
              'package.json': JSON.stringify(replaceBrowserField({
                name: 'aPackage',
                browser: {
                  'node-package': 'browser-package',
                },
              }, fieldName)),
              'index.js': 'require("node-package")',
              'node-package': {
                'package.json': JSON.stringify({
                  'name': 'node-package',
                }),
                'index.js': 'some node code',
              },
              'browser-package': {
                'package.json': JSON.stringify({
                  'name': 'browser-package',
                }),
                'index.js': 'some browser code',
              },
            },
          },
        });

        var dgraph = new DependencyGraph({
          ...defaults,
          roots: [root],
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              { id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'aPackage/index.js',
                path: '/root/aPackage/index.js',
                dependencies: ['node-package'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              { id: 'browser-package/index.js',
                path: '/root/aPackage/browser-package/index.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });
    }

    pit('should fall back to browser mapping from react-native mapping', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              'react-native': {
                'node-package': 'rn-package',
              },
            }),
            'index.js': 'require("node-package")',
            'node_modules': {
              'node-package': {
                'package.json': JSON.stringify({
                  'name': 'node-package',
                }),
                'index.js': 'some node code',
              },
              'rn-package': {
                'package.json': JSON.stringify({
                  'name': 'rn-package',
                  browser: {
                    'nested-package': 'nested-browser-package',
                  },
                }),
                'index.js': 'require("nested-package")',
              },
              'nested-browser-package': {
                'package.json': JSON.stringify({
                  'name': 'nested-browser-package',
                }),
                'index.js': 'some code',
              },
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            { id: 'index',
              path: '/root/index.js',
              dependencies: ['aPackage'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            { id: 'aPackage/index.js',
              path: '/root/aPackage/index.js',
              dependencies: ['node-package'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            { id: 'rn-package/index.js',
              path: '/root/aPackage/node_modules/rn-package/index.js',
              dependencies: ['nested-package'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            { id: 'nested-browser-package/index.js',
              path: '/root/aPackage/node_modules/nested-browser-package/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });
  });

  describe('node_modules', function() {
    pit('should work with nested node_modules', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo");',
            'require("bar");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': 'require("bar");\nfoo module',
              'node_modules': {
                'bar': {
                  'package.json': JSON.stringify({
                    name: 'bar',
                    main: 'main.js',
                  }),
                  'main.js': 'bar 1 module',
                },
              },
            },
            'bar': {
              'package.json': JSON.stringify({
                name: 'bar',
                main: 'main.js',
              }),
              'main.js': 'bar 2 module',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['foo', 'bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'foo/main.js',
              path: '/root/node_modules/foo/main.js',
              dependencies: ['bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/main.js',
              path: '/root/node_modules/foo/node_modules/bar/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/main.js',
              path: '/root/node_modules/bar/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('platform should work with node_modules', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.ios.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo");',
            'require("bar");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
              }),
              'index.ios.js': '',
            },
            'bar': {
              'package.json': JSON.stringify({
                name: 'bar',
                main: 'main',
              }),
              'main.ios.js': '',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.ios.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.ios.js',
              dependencies: ['foo', 'bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'foo/index.ios.js',
              path: '/root/node_modules/foo/index.ios.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/main.ios.js',
              path: '/root/node_modules/bar/main.ios.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('nested node_modules with specific paths', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo");',
            'require("bar/");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': 'require("bar/lol");\nfoo module',
              'node_modules': {
                'bar': {
                  'package.json': JSON.stringify({
                    name: 'bar',
                    main: 'main.js',
                  }),
                  'main.js': 'bar 1 module',
                  'lol.js': '',
                },
              },
            },
            'bar': {
              'package.json': JSON.stringify({
                name: 'bar',
                main: 'main.js',
              }),
              'main.js': 'bar 2 module',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['foo', 'bar/'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'foo/main.js',
              path: '/root/node_modules/foo/main.js',
              dependencies: ['bar/lol'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/lol.js',
              path: '/root/node_modules/foo/node_modules/bar/lol.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/main.js',
              path: '/root/node_modules/bar/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('nested node_modules with browser field', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo");',
            'require("bar");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': 'require("bar/lol");\nfoo module',
              'node_modules': {
                'bar': {
                  'package.json': JSON.stringify({
                    name: 'bar',
                    main: 'main.js',
                    browser: {
                      './lol': './wow',
                    },
                  }),
                  'main.js': 'bar 1 module',
                  'lol.js': '',
                  'wow.js': '',
                },
              },
            },
            'bar': {
              'package.json': JSON.stringify({
                name: 'bar',
                browser: './main2',
              }),
              'main2.js': 'bar 2 module',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['foo', 'bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'foo/main.js',
              path: '/root/node_modules/foo/main.js',
              dependencies: ['bar/lol'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/lol.js',
              path: '/root/node_modules/foo/node_modules/bar/lol.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/main2.js',
              path: '/root/node_modules/bar/main2.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('node_modules should support multi level', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("bar");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': '',
            },
          },
          'path': {
            'to': {
              'bar.js': [
                '/**',
                ' * @providesModule bar',
                ' */',
                'require("foo")',
              ].join('\n'),
            },
            'node_modules': {},
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar',
              path: '/root/path/to/bar.js',
              dependencies: ['foo'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'foo/main.js',
              path: '/root/node_modules/foo/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should selectively ignore providesModule in node_modules', function() {
      var root = '/root';
      var otherRoot = '/anotherRoot';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("shouldWork");',
            'require("dontWork");',
            'require("wontWork");',
            'require("ember");',
            'require("internalVendoredPackage");',
            'require("anotherIndex");',
          ].join('\n'),
          'node_modules': {
            'react-haste': {
              'package.json': JSON.stringify({
                name: 'react-haste',
                main: 'main.js',
              }),
              // @providesModule should not be ignored here, because react-haste is whitelisted
              'main.js': [
                '/**',
                ' * @providesModule shouldWork',
                ' */',
                'require("submodule");',
              ].join('\n'),
              'node_modules': {
                'bar': {
                  'package.json': JSON.stringify({
                    name: 'bar',
                    main: 'main.js',
                  }),
                  // @providesModule should be ignored here, because it's not whitelisted
                  'main.js':[
                    '/**',
                    ' * @providesModule dontWork',
                    ' */',
                    'hi();',
                  ].join('\n'),
                },
                'submodule': {
                  'package.json': JSON.stringify({
                    name: 'submodule',
                    main: 'main.js',
                  }),
                  'main.js': 'log()',
                },
              },
            },
            'ember': {
              'package.json': JSON.stringify({
                name: 'ember',
                main: 'main.js',
              }),
              // @providesModule should be ignored here, because it's not whitelisted,
              // and also, the modules "id" should be ember/main.js, not it's haste name
              'main.js':[
                '/**',
                ' * @providesModule wontWork',
                ' */',
                'hi();',
              ].join('\n'),
            },
          },
          // This part of the dep graph is meant to emulate internal facebook infra.
          // By whitelisting `vendored_modules`, haste should still work.
          'vendored_modules': {
            'a-vendored-package': {
              'package.json': JSON.stringify({
                name: 'a-vendored-package',
                main: 'main.js',
              }),
              // @providesModule should _not_ be ignored here, because it's whitelisted.
              'main.js':[
                '/**',
                ' * @providesModule internalVendoredPackage',
                ' */',
                'hiFromInternalPackage();',
              ].join('\n'),
            },
          },
        },
        // we need to support multiple roots and using haste between them
        'anotherRoot': {
          'index.js': [
            '/**',
            ' * @providesModule anotherIndex',
            ' */',
            'wazup()',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root, otherRoot],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: [
                'shouldWork',
                'dontWork',
                'wontWork',
                'ember',
                'internalVendoredPackage',
                'anotherIndex',
              ],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'shouldWork',
              path: '/root/node_modules/react-haste/main.js',
              dependencies: ['submodule'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'submodule/main.js',
              path: '/root/node_modules/react-haste/node_modules/submodule/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'ember/main.js',
              path: '/root/node_modules/ember/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'internalVendoredPackage',
              path: '/root/vendored_modules/a-vendored-package/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'anotherIndex',
              path: '/anotherRoot/index.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should not be confused by prev occuring whitelisted names', function() {
      var root = '/react-haste';
      fs.__setMockFilesystem({
        'react-haste': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("shouldWork");',
          ].join('\n'),
          'node_modules': {
            'react-haste': {
              'package.json': JSON.stringify({
                name: 'react-haste',
                main: 'main.js',
              }),
              'main.js': [
                '/**',
                ' * @providesModule shouldWork',
                ' */',
              ].join('\n'),
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/react-haste/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/react-haste/index.js',
              dependencies: ['shouldWork'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'shouldWork',
              path: '/react-haste/node_modules/react-haste/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });


    pit('should ignore modules it cant find (assumes own require system)', function() {
      // For example SourceMap.js implements it's own require system.
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo/lol");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': 'foo module',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['foo/lol'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should work with node packages with a .js in the name', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("sha.js")',
          ].join('\n'),
          'node_modules': {
            'sha.js': {
              'package.json': JSON.stringify({
                name: 'sha.js',
                main: 'main.js',
              }),
              'main.js': 'lol',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['sha.js'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'sha.js/main.js',
              path: '/root/node_modules/sha.js/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should work with multiple platforms (haste)', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.ios.js': `
            /**
             * @providesModule index
             */
             require('a');
          `,
          'a.ios.js': `
            /**
             * @providesModule a
             */
          `,
          'a.android.js': `
            /**
             * @providesModule a
             */
          `,
          'a.js': `
            /**
             * @providesModule a
             */
          `,
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.ios.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.ios.js',
              dependencies: ['a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'a',
              path: '/root/a.ios.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should pick the generic file', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.ios.js': `
            /**
             * @providesModule index
             */
             require('a');
          `,
          'a.android.js': `
            /**
             * @providesModule a
             */
          `,
          'a.js': `
            /**
             * @providesModule a
             */
          `,
          'a.web.js': `
            /**
             * @providesModule a
             */
          `,
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.ios.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.ios.js',
              dependencies: ['a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'a',
              path: '/root/a.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should work with multiple platforms (node)', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.ios.js': `
            /**
             * @providesModule index
             */
             require('./a');
          `,
          'a.ios.js': '',
          'a.android.js': '',
          'a.js': '',
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.ios.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.ios.js',
              dependencies: ['./a'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: '/root/a.ios.js',
              path: '/root/a.ios.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
          ]);
      });
    });

    pit('should require package.json', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo/package.json");',
            'require("bar");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
            },
            'bar': {
              'package.json': JSON.stringify({
                name: 'bar',
                main: 'main.js',
              }),
              'main.js': 'require("./package.json")',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(deps => {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['foo/package.json', 'bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'foo/package.json',
              path: '/root/node_modules/foo/package.json',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: true,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/main.js',
              path: '/root/node_modules/bar/main.js',
              dependencies: ['./package.json'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
            },
            {
              id: 'bar/package.json',
              path: '/root/node_modules/bar/package.json',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: true,
              isPolyfill: false,
              resolution: undefined,
            },

          ]);
      });
    });
  });

  describe('file watch updating', function() {
    var triggerFileChange;
    var mockStat = {
      isDirectory: () => false,
    };

    beforeEach(function() {
      var callbacks = [];
      triggerFileChange = (...args) =>
        callbacks.map(callback => callback(...args));

      defaults.fileWatcher = {
        on: function(eventType, callback) {
          if (eventType !== 'all') {
            throw new Error('Can only handle "all" event in watcher.');
          }
          callbacks.push(callback);
          return this;
        },
        isWatchman: () => Promise.resolve(false),
      };
    });

    pit('updates module dependencies', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")',
          ].join('\n'),
          'foo': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root['index.js'] =
          filesystem.root['index.js'].replace('require("foo")', '');
        triggerFileChange('change', 'index.js', root, mockStat);
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });
    });

    pit('updates module dependencies on file change', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")',
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root['index.js'] =
          filesystem.root['index.js'].replace('require("foo")', '');
        triggerFileChange('change', 'index.js', root, mockStat);
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });
    });

    pit('updates module dependencies on file delete', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")',
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        delete filesystem.root.foo;
        triggerFileChange('delete', 'foo.js', root);
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage', 'foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
            ]);
        });
      });
    });

    pit('updates module dependencies on file add', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")',
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root['bar.js'] = [
          '/**',
          ' * @providesModule bar',
          ' */',
          'require("foo")',
        ].join('\n');
        triggerFileChange('add', 'bar.js', root, mockStat);

        filesystem.root.aPackage['main.js'] = 'require("bar")';
        triggerFileChange('change', 'aPackage/main.js', root, mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage', 'foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'aPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: ['bar'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
              },
              {
                id: 'bar',
                path: '/root/bar.js',
                dependencies: ['foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'foo',
                path: '/root/foo.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('updates module dependencies on deprecated asset add', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("image!foo")',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        assetRoots_DEPRECATED: [root],
        assetExts: ['png'],
      });

      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['image!foo'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);

        filesystem.root['foo.png'] = '';
        triggerFileChange('add', 'foo.png', root, mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps2) {
          expect(deps2)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['image!foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'image!foo',
                path: '/root/foo.png',
                dependencies: [],
                isAsset_DEPRECATED: true,
                resolution: 1,
                isAsset: false,
                isJSON: false,
                isPolyfill: false,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('updates module dependencies on relative asset add', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("./foo.png")',
          ].join('\n'),
          'package.json': JSON.stringify({
            name: 'aPackage',
          }),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        assetExts: ['png'],
      });

      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            { id: 'index',
              path: '/root/index.js',
              dependencies: ['./foo.png'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);

        filesystem.root['foo.png'] = '';
        triggerFileChange('add', 'foo.png', root, mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps2) {
          expect(deps2)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['./foo.png'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'aPackage/foo.png',
                path: '/root/foo.png',
                dependencies: [],
                isAsset: true,
                resolution: 1,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('runs changes through ignore filter', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")',
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        ignoreFilePath: function(filePath) {
          if (filePath === '/root/bar.js') {
            return true;
          }
          return false;
        },
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root['bar.js'] = [
          '/**',
          ' * @providesModule bar',
          ' */',
          'require("foo")',
        ].join('\n');
        triggerFileChange('add', 'bar.js', root, mockStat);

        filesystem.root.aPackage['main.js'] = 'require("bar")';
        triggerFileChange('change', 'aPackage/main.js', root, mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage', 'foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'aPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: ['bar'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'foo',
                path: '/root/foo.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('should ignore directory updates', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
            'require("foo")',
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });
      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        triggerFileChange('change', 'aPackage', '/root', {
          isDirectory: () => true,
        });
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage', 'foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'aPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'foo',
                path: '/root/foo.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('updates package.json', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root['index.js'] = filesystem.root['index.js'].replace(/aPackage/, 'bPackage');
        triggerFileChange('change', 'index.js', root, mockStat);

        filesystem.root.aPackage['package.json'] = JSON.stringify({
          name: 'bPackage',
          main: 'main.js',
        });
        triggerFileChange('change', 'package.json', '/root/aPackage', mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['bPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'bPackage/main.js',
                path: '/root/aPackage/main.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('changes to browser field', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
            'browser.js': 'browser',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root.aPackage['package.json'] = JSON.stringify({
          name: 'aPackage',
          main: 'main.js',
          browser: 'browser.js',
        });
        triggerFileChange('change', 'package.json', '/root/aPackage', mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'aPackage/browser.js',
                path: '/root/aPackage/browser.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('removes old package from cache', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("aPackage")',
          ].join('\n'),
          'aPackage': {
            'package.json': JSON.stringify({
              name: 'aPackage',
              main: 'main.js',
            }),
            'main.js': 'main',
            'browser.js': 'browser',
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        filesystem.root.aPackage['package.json'] = JSON.stringify({
          name: 'bPackage',
          main: 'main.js',
        });
        triggerFileChange('change', 'package.json', '/root/aPackage', mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
          expect(deps)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['aPackage'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('should update node package changes', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': 'require("bar");\nfoo module',
              'node_modules': {
                'bar': {
                  'package.json': JSON.stringify({
                    name: 'bar',
                    main: 'main.js',
                  }),
                  'main.js': 'bar 1 module',
                },
              },
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        expect(deps)
          .toEqual([
            {
              id: 'index',
              path: '/root/index.js',
              dependencies: ['foo'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'foo/main.js',
              path: '/root/node_modules/foo/main.js',
              dependencies: ['bar'],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
            {
              id: 'bar/main.js',
              path: '/root/node_modules/foo/node_modules/bar/main.js',
              dependencies: [],
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              resolution: undefined,
              resolveDependency: undefined,
            },
          ]);

        filesystem.root.node_modules.foo['main.js'] = 'lol';
        triggerFileChange('change', 'main.js', '/root/node_modules/foo', mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps2) {
          expect(deps2)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'foo/main.js',
                path: '/root/node_modules/foo/main.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('should update node package main changes', function() {
      var root = '/root';
      var filesystem = fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("foo");',
          ].join('\n'),
          'node_modules': {
            'foo': {
              'package.json': JSON.stringify({
                name: 'foo',
                main: 'main.js',
              }),
              'main.js': 'foo module',
              'browser.js': 'foo module',
            },
          },
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });
      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps) {
        filesystem.root.node_modules.foo['package.json'] = JSON.stringify({
          name: 'foo',
          main: 'main.js',
          browser: 'browser.js',
        });
        triggerFileChange('change', 'package.json', '/root/node_modules/foo', mockStat);

        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function(deps2) {
          expect(deps2)
            .toEqual([
              {
                id: 'index',
                path: '/root/index.js',
                dependencies: ['foo'],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
              {
                id: 'foo/browser.js',
                path: '/root/node_modules/foo/browser.js',
                dependencies: [],
                isAsset: false,
                isAsset_DEPRECATED: false,
                isJSON: false,
                isPolyfill: false,
                resolution: undefined,
                resolveDependency: undefined,
              },
            ]);
        });
      });
    });

    pit('should not error when the watcher reports a known file as added', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'var b = require("b");',
          ].join('\n'),
          'b.js': [
            '/**',
            ' * @providesModule b',
            ' */',
            'module.exports = function() {};',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });

      return getOrderedDependenciesAsJSON(dgraph, '/root/index.js').then(function() {
        triggerFileChange('add', 'index.js', root, mockStat);
        return getOrderedDependenciesAsJSON(dgraph, '/root/index.js');
      });
    });
  });

  describe('getAsyncDependencies', () => {
    pit('should get dependencies', function() {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.js': [
            '/**',
            ' * @providesModule index',
            ' */',
            'System.' + 'import("a")',
          ].join('\n'),
          'a.js': [
            '/**',
            ' * @providesModule a',
            ' */',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });

      return dgraph.getDependencies('/root/index.js')
        .then(response => response.finalize())
        .then(({ asyncDependencies }) => {
          expect(asyncDependencies).toEqual([
            ['/root/a.js'],
          ]);
        });
    });
  });

  describe('Extensions', () => {
    pit('supports custom file extensions', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          'index.jsx': [
            '/**',
            ' * @providesModule index',
            ' */',
            'require("a")',
          ].join('\n'),
          'a.coffee': [
            '/**',
            ' * @providesModule a',
            ' */',
          ].join('\n'),
          'X.js': '',
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        extensions: ['jsx', 'coffee'],
      });

      return dgraph.matchFilesByPattern('.*')
        .then(files => {
          expect(files).toEqual([
            '/root/index.jsx', '/root/a.coffee',
          ]);
        })
        .then(() => getOrderedDependenciesAsJSON(dgraph, '/root/index.jsx'))
        .then(deps => {
          expect(deps).toEqual([
            {
              dependencies: ['a'],
              id: 'index',
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              path: '/root/index.jsx',
              resolution: undefined,
            },
            {
              dependencies: [],
              id: 'a',
              isAsset: false,
              isAsset_DEPRECATED: false,
              isJSON: false,
              isPolyfill: false,
              path: '/root/a.coffee',
              resolution: undefined,
            },
          ]);
        });
    });
  });

  describe('Mocks', () => {
    pit('resolves to null if mocksPattern is not specified', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          '__mocks__': {
            'A.js': '',
          },
          'index.js': '',
        },
      });
      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
      });

      return dgraph.getDependencies('/root/index.js')
        .then(response => response.finalize())
        .then(response => {
          expect(response.mocks).toEqual({});
        });
    });

    pit('retrieves a list of all required mocks', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          '__mocks__': {
            'A.js': '',
            'b.js': '',
          },
          'b.js': [
            '/**',
            ' * @providesModule b',
            ' */',
            'require("A");',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        mocksPattern,
      });

      return dgraph.getDependencies('/root/b.js')
        .then(response => response.finalize())
        .then(response => {
          expect(response.mocks).toEqual({
            A: '/root/__mocks__/A.js',
            b: '/root/__mocks__/b.js',
          });
        });
    });

    pit('adds mocks as a dependency of their actual module', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          '__mocks__': {
            'A.js': [
              'require("b");',
            ].join('\n'),
            'b.js': '',
          },
          'A.js': [
            '/**',
            ' * @providesModule A',
            ' */',
            'require("foo");',
          ].join('\n'),
          'foo.js': [
            '/**',
            ' * @providesModule foo',
            ' */',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        mocksPattern,
      });

      return getOrderedDependenciesAsJSON(dgraph, '/root/A.js')
        .then(deps => {
          expect(deps).toEqual([
            {
              path: '/root/A.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: 'A',
              dependencies: ['foo', 'A'],
            },
            {
              path: '/root/foo.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: 'foo',
              dependencies: [],
            },
            {
              path: '/root/__mocks__/A.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: '/root/__mocks__/A.js',
              dependencies: ['b'],
            },
            {
              path: '/root/__mocks__/b.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: '/root/__mocks__/b.js',
              dependencies: [],
            },
          ]);
        });
    });

    pit('resolves mocks that do not have a real module associated with them', () => {
      var root = '/root';
      fs.__setMockFilesystem({
        'root': {
          '__mocks__': {
            'foo.js': [
              'require("b");',
            ].join('\n'),
            'b.js': '',
          },
          'A.js': [
            '/**',
            ' * @providesModule A',
            ' */',
            'require("foo");',
          ].join('\n'),
        },
      });

      var dgraph = new DependencyGraph({
        ...defaults,
        roots: [root],
        mocksPattern,
      });

      return getOrderedDependenciesAsJSON(dgraph, '/root/A.js')
        .then(deps => {
          expect(deps).toEqual([
            {
              path: '/root/A.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: 'A',
              dependencies: ['foo'],
            },
            {
              path: '/root/__mocks__/foo.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: '/root/__mocks__/foo.js',
              dependencies: ['b'],
            },
            {
              path: '/root/__mocks__/b.js',
              isJSON: false,
              isAsset: false,
              isAsset_DEPRECATED: false,
              isPolyfill: false,
              id: '/root/__mocks__/b.js',
              dependencies: [],
            },
          ]);
        });
    });
  });
});
