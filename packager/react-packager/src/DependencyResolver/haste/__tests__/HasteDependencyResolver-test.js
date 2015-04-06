/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../')
    .dontMock('q')
    .dontMock('../requirePattern')
    .setMock('../../ModuleDescriptor', function(data) {return data;});

var Promise = require('bluebird');

describe('HasteDependencyResolver', function() {
  var HasteDependencyResolver;

  beforeEach(function() {
    // For the polyfillDeps
    require('path').join.mockImpl(function(a, b) {
      return b;
    });
    HasteDependencyResolver = require('../');
  });

  describe('getDependencies', function() {
    pit('should get dependencies with polyfills', function() {
      var module = {id: 'index', path: '/root/index.js', dependencies: ['a']};
      var deps = [module];

      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
      });

      // Is there a better way? How can I mock the prototype instead?
      var depGraph = depResolver._depGraph;
      depGraph.getOrderedDependencies.mockImpl(function() {
        return deps;
      });
      depGraph.load.mockImpl(function() {
        return Promise.resolve();
      });

      return depResolver.getDependencies('/root/index.js', { dev: false })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(result.dependencies).toEqual([
            { path: 'polyfills/prelude.js',
              id: 'polyfills/prelude.js',
              isPolyfill: true,
              dependencies: []
            },
            { path: 'polyfills/require.js',
              id: 'polyfills/require.js',
              isPolyfill: true,
              dependencies: ['polyfills/prelude.js']
            },
            { path: 'polyfills/polyfills.js',
              id: 'polyfills/polyfills.js',
              isPolyfill: true,
              dependencies: ['polyfills/prelude.js', 'polyfills/require.js']
            },
            { id: 'polyfills/console.js',
              isPolyfill: true,
              path: 'polyfills/console.js',
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js'
              ],
            },
            { id: 'polyfills/error-guard.js',
              isPolyfill: true,
              path: 'polyfills/error-guard.js',
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js'
              ],
            },
            module
          ]);
        });
    });

    pit('should get dependencies with polyfills', function() {
      var module = {id: 'index', path: '/root/index.js', dependencies: ['a']};
      var deps = [module];

      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
      });

      // Is there a better way? How can I mock the prototype instead?
      var depGraph = depResolver._depGraph;
      depGraph.getOrderedDependencies.mockImpl(function() {
        return deps;
      });
      depGraph.load.mockImpl(function() {
        return Promise.resolve();
      });

      return depResolver.getDependencies('/root/index.js', { dev: true })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(result.dependencies).toEqual([
            { path: 'polyfills/prelude_dev.js',
              id: 'polyfills/prelude_dev.js',
              isPolyfill: true,
              dependencies: []
            },
            { path: 'polyfills/require.js',
              id: 'polyfills/require.js',
              isPolyfill: true,
              dependencies: ['polyfills/prelude_dev.js']
            },
            { path: 'polyfills/polyfills.js',
              id: 'polyfills/polyfills.js',
              isPolyfill: true,
              dependencies: ['polyfills/prelude_dev.js', 'polyfills/require.js']
            },
            { id: 'polyfills/console.js',
              isPolyfill: true,
              path: 'polyfills/console.js',
              dependencies: [
                'polyfills/prelude_dev.js',
                'polyfills/require.js',
                'polyfills/polyfills.js'
              ],
            },
            { id: 'polyfills/error-guard.js',
              isPolyfill: true,
              path: 'polyfills/error-guard.js',
              dependencies: [
                'polyfills/prelude_dev.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js'
              ],
            },
            module
          ]);
        });
    });

    pit('should pass in more polyfills', function() {
      var module = {id: 'index', path: '/root/index.js', dependencies: ['a']};
      var deps = [module];

      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
        polyfillModuleNames: ['some module'],
      });

      // Is there a better way? How can I mock the prototype instead?
      var depGraph = depResolver._depGraph;
      depGraph.getOrderedDependencies.mockImpl(function() {
        return deps;
      });
      depGraph.load.mockImpl(function() {
        return Promise.resolve();
      });

      return depResolver.getDependencies('/root/index.js', { dev: false })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(result.dependencies).toEqual([
            { path: 'polyfills/prelude.js',
              id: 'polyfills/prelude.js',
              isPolyfill: true,
              dependencies: []
            },
            { path: 'polyfills/require.js',
              id: 'polyfills/require.js',
              isPolyfill: true,
              dependencies: ['polyfills/prelude.js']
            },
            { path: 'polyfills/polyfills.js',
              id: 'polyfills/polyfills.js',
              isPolyfill: true,
              dependencies: ['polyfills/prelude.js', 'polyfills/require.js']
            },
            { id: 'polyfills/console.js',
              isPolyfill: true,
              path: 'polyfills/console.js',
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js'
              ],
            },
            { id: 'polyfills/error-guard.js',
              isPolyfill: true,
              path: 'polyfills/error-guard.js',
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js'
              ],
            },
            { path: 'some module',
              id: 'some module',
              isPolyfill: true,
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
              ]
            },
            module
          ]);
        });
    });
  });

  describe('wrapModule', function() {
    it('should resolve modules', function() {
      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
      });

      var depGraph = depResolver._depGraph;
      var dependencies = ['x', 'y', 'z', 'a', 'b'];
      var code = [
        'require("x")',
        'require("y")',
        'require( "z" )',
        'require( "a")',
        'require("b" )',
      ].join('\n');

      depGraph.resolveDependency.mockImpl(function(fromModule, toModuleName) {
        if (toModuleName === 'x') {
          return {
            id: 'changed'
          };
        } else if (toModuleName === 'y') {
          return { id: 'y' };
        }
        return null;
      });

      var processedCode = depResolver.wrapModule({
        id: 'test module',
        path: '/root/test.js',
        dependencies: dependencies
      }, code);

      expect(processedCode).toEqual([
        '__d(\'test module\',["changed","y"],function(global,' +
        ' require, requireDynamic, requireLazy, module, exports) {' +
        '  require(\'changed\')',
        'require(\'y\')',
        'require("z")',
        'require("a")',
        'require("b")});',
      ].join('\n'));
    });
  });
});
