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
    .dontMock('../replacePatterns')
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

      /*eslint-disable */
      var code = [
        "import'x';",
        "import 'x';",
        "import 'x' ;",
        "import Default from 'x';",
        "import * as All from 'x';",
        "import {} from 'x';",
        "import { } from 'x';",
        "import {Foo} from 'x';",
        "import { Foo } from 'x';",
        "import { Foo, } from 'x';",
        "import {Foo as Bar} from 'x';",
        "import { Foo as Bar } from 'x';",
        "import { Foo as Bar, } from 'x';",
        "import { Foo, Bar } from 'x';",
        "import { Foo, Bar, } from 'x';",
        "import { Foo as Bar, Baz } from 'x';",
        "import { Foo as Bar, Baz, } from 'x';",
        "import { Foo, Bar as Baz } from 'x';",
        "import { Foo, Bar as Baz, } from 'x';",
        "import { Foo as Bar, Baz as Qux } from 'x';",
        "import { Foo as Bar, Baz as Qux, } from 'x';",
        "import { Foo, Bar, Baz } from 'x';",
        "import { Foo, Bar, Baz, } from 'x';",
        "import { Foo as Bar, Baz, Qux } from 'x';",
        "import { Foo as Bar, Baz, Qux, } from 'x';",
        "import { Foo, Bar as Baz, Qux } from 'x';",
        "import { Foo, Bar as Baz, Qux, } from 'x';",
        "import { Foo, Bar, Baz as Qux } from 'x';",
        "import { Foo, Bar, Baz as Qux, } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "import { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "import { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "import { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "import { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf as Enuf } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'x';",
        "import Default, * as All from 'x';",
        "import Default, { } from 'x';",
        "import Default, { Foo } from 'x';",
        "import Default, { Foo, } from 'x';",
        "import Default, { Foo as Bar } from 'x';",
        "import Default, { Foo as Bar, } from 'x';",
        "import Default, { Foo, Bar } from 'x';",
        "import Default, { Foo, Bar, } from 'x';",
        "import Default, { Foo as Bar, Baz } from 'x';",
        "import Default, { Foo as Bar, Baz, } from 'x';",
        "import Default, { Foo, Bar as Baz } from 'x';",
        "import Default, { Foo, Bar as Baz, } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, } from 'x';",
        "import Default, { Foo, Bar, Baz } from 'x';",
        "import Default, { Foo, Bar, Baz, } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux, } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux, } from 'x';",
        "import Default, { Foo, Bar, Baz as Qux } from 'x';",
        "import Default, { Foo, Bar, Baz as Qux, } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'x';",
        "import Default , { } from 'x';",
        'import "x";',
        'import Default from "x";',
        'import * as All from "x";',
        'import { } from "x";',
        'import { Foo } from "x";',
        'import { Foo, } from "x";',
        'import { Foo as Bar } from "x";',
        'import { Foo as Bar, } from "x";',
        'import { Foo, Bar } from "x";',
        'import { Foo, Bar, } from "x";',
        'import { Foo as Bar, Baz } from "x";',
        'import { Foo as Bar, Baz, } from "x";',
        'import { Foo, Bar as Baz } from "x";',
        'import { Foo, Bar as Baz, } from "x";',
        'import { Foo as Bar, Baz as Qux } from "x";',
        'import { Foo as Bar, Baz as Qux, } from "x";',
        'import { Foo, Bar, Baz } from "x";',
        'import { Foo, Bar, Baz, } from "x";',
        'import { Foo as Bar, Baz, Qux } from "x";',
        'import { Foo as Bar, Baz, Qux, } from "x";',
        'import { Foo, Bar as Baz, Qux } from "x";',
        'import { Foo, Bar as Baz, Qux, } from "x";',
        'import { Foo, Bar, Baz as Qux } from "x";',
        'import { Foo, Bar, Baz as Qux, } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'import { Foo as Bar, Baz, Qux as Norf } from "x";',
        'import { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'import { Foo, Bar as Baz, Qux as Norf } from "x";',
        'import { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf as NoMore } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf as NoMore, } from "x";',
        'import Default, * as All from "x";',
        'import Default, { } from "x";',
        'import Default, { Foo } from "x";',
        'import Default, { Foo, } from "x";',
        'import Default, { Foo as Bar } from "x";',
        'import Default, { Foo as Bar, } from "x";',
        'import Default, { Foo, Bar } from "x";',
        'import Default, { Foo, Bar, } from "x";',
        'import Default, { Foo as Bar, Baz } from "x";',
        'import Default, { Foo as Bar, Baz, } from "x";',
        'import Default, { Foo, Bar as Baz } from "x";',
        'import Default, { Foo, Bar as Baz, } from "x";',
        'import Default, { Foo as Bar, Baz as Qux } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, } from "x";',
        'import Default, { Foo, Bar, Baz } from "x";',
        'import Default, { Foo, Bar, Baz, } from "x";',
        'import Default, { Foo as Bar, Baz, Qux } from "x";',
        'import Default, { Foo as Bar, Baz, Qux, } from "x";',
        'import Default, { Foo, Bar as Baz, Qux } from "x";',
        'import Default, { Foo, Bar as Baz, Qux, } from "x";',
        'import Default, { Foo, Bar, Baz as Qux } from "x";',
        'import Default, { Foo, Bar, Baz as Qux, } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'import Default, { Foo as Bar, Baz, Qux as Norf } from "x";',
        'import Default, { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'import Default, { Foo, Bar as Baz, Qux as Norf } from "x";',
        'import Default, { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "x";',
        'import Default from "y";',
        'import * as All from \'z\';',
        'require("x")',
        'require("y")',
        'require( \'z\' )',
        'require( "a")',
        'require("b" )',
      ].join('\n');
      /*eslint-disable */

      depGraph.resolveDependency.mockImpl(function(fromModule, toModuleName) {
        if (toModuleName === 'x') {
          return {
            id: 'changed'
          };
        } else if (toModuleName === 'y') {
          return { id: 'Y' };
        }
        return null;
      });

      var processedCode = depResolver.wrapModule({
        id: 'test module',
        path: '/root/test.js',
        dependencies: dependencies
      }, code);

      expect(processedCode).toEqual([
        '__d(\'test module\',["changed","Y"],function(global,' +
        ' require, requireDynamic, requireLazy, module, exports) {  ' +
        "import'x';",
        "import 'changed';",
        "import 'changed' ;",
        "import Default from 'changed';",
        "import * as All from 'changed';",
        "import {} from 'changed';",
        "import { } from 'changed';",
        "import {Foo} from 'changed';",
        "import { Foo } from 'changed';",
        "import { Foo, } from 'changed';",
        "import {Foo as Bar} from 'changed';",
        "import { Foo as Bar } from 'changed';",
        "import { Foo as Bar, } from 'changed';",
        "import { Foo, Bar } from 'changed';",
        "import { Foo, Bar, } from 'changed';",
        "import { Foo as Bar, Baz } from 'changed';",
        "import { Foo as Bar, Baz, } from 'changed';",
        "import { Foo, Bar as Baz } from 'changed';",
        "import { Foo, Bar as Baz, } from 'changed';",
        "import { Foo as Bar, Baz as Qux } from 'changed';",
        "import { Foo as Bar, Baz as Qux, } from 'changed';",
        "import { Foo, Bar, Baz } from 'changed';",
        "import { Foo, Bar, Baz, } from 'changed';",
        "import { Foo as Bar, Baz, Qux } from 'changed';",
        "import { Foo as Bar, Baz, Qux, } from 'changed';",
        "import { Foo, Bar as Baz, Qux } from 'changed';",
        "import { Foo, Bar as Baz, Qux, } from 'changed';",
        "import { Foo, Bar, Baz as Qux } from 'changed';",
        "import { Foo, Bar, Baz as Qux, } from 'changed';",
        "import { Foo as Bar, Baz as Qux, Norf } from 'changed';",
        "import { Foo as Bar, Baz as Qux, Norf, } from 'changed';",
        "import { Foo as Bar, Baz, Qux as Norf } from 'changed';",
        "import { Foo as Bar, Baz, Qux as Norf, } from 'changed';",
        "import { Foo, Bar as Baz, Qux as Norf } from 'changed';",
        "import { Foo, Bar as Baz, Qux as Norf, } from 'changed';",
        "import { Foo as Bar, Baz as Qux, Norf as Enuf } from 'changed';",
        "import { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'changed';",
        "import Default, * as All from 'changed';",
        "import Default, { } from 'changed';",
        "import Default, { Foo } from 'changed';",
        "import Default, { Foo, } from 'changed';",
        "import Default, { Foo as Bar } from 'changed';",
        "import Default, { Foo as Bar, } from 'changed';",
        "import Default, { Foo, Bar } from 'changed';",
        "import Default, { Foo, Bar, } from 'changed';",
        "import Default, { Foo as Bar, Baz } from 'changed';",
        "import Default, { Foo as Bar, Baz, } from 'changed';",
        "import Default, { Foo, Bar as Baz } from 'changed';",
        "import Default, { Foo, Bar as Baz, } from 'changed';",
        "import Default, { Foo as Bar, Baz as Qux } from 'changed';",
        "import Default, { Foo as Bar, Baz as Qux, } from 'changed';",
        "import Default, { Foo, Bar, Baz } from 'changed';",
        "import Default, { Foo, Bar, Baz, } from 'changed';",
        "import Default, { Foo as Bar, Baz, Qux } from 'changed';",
        "import Default, { Foo as Bar, Baz, Qux, } from 'changed';",
        "import Default, { Foo, Bar as Baz, Qux } from 'changed';",
        "import Default, { Foo, Bar as Baz, Qux, } from 'changed';",
        "import Default, { Foo, Bar, Baz as Qux } from 'changed';",
        "import Default, { Foo, Bar, Baz as Qux, } from 'changed';",
        "import Default, { Foo as Bar, Baz as Qux, Norf } from 'changed';",
        "import Default, { Foo as Bar, Baz as Qux, Norf, } from 'changed';",
        "import Default, { Foo as Bar, Baz, Qux as Norf } from 'changed';",
        "import Default, { Foo as Bar, Baz, Qux as Norf, } from 'changed';",
        "import Default, { Foo, Bar as Baz, Qux as Norf } from 'changed';",
        "import Default, { Foo, Bar as Baz, Qux as Norf, } from 'changed';",
        "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'changed';",
        "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'changed';",
        "import Default , { } from 'changed';",
        'import "changed";',
        'import Default from "changed";',
        'import * as All from "changed";',
        'import { } from "changed";',
        'import { Foo } from "changed";',
        'import { Foo, } from "changed";',
        'import { Foo as Bar } from "changed";',
        'import { Foo as Bar, } from "changed";',
        'import { Foo, Bar } from "changed";',
        'import { Foo, Bar, } from "changed";',
        'import { Foo as Bar, Baz } from "changed";',
        'import { Foo as Bar, Baz, } from "changed";',
        'import { Foo, Bar as Baz } from "changed";',
        'import { Foo, Bar as Baz, } from "changed";',
        'import { Foo as Bar, Baz as Qux } from "changed";',
        'import { Foo as Bar, Baz as Qux, } from "changed";',
        'import { Foo, Bar, Baz } from "changed";',
        'import { Foo, Bar, Baz, } from "changed";',
        'import { Foo as Bar, Baz, Qux } from "changed";',
        'import { Foo as Bar, Baz, Qux, } from "changed";',
        'import { Foo, Bar as Baz, Qux } from "changed";',
        'import { Foo, Bar as Baz, Qux, } from "changed";',
        'import { Foo, Bar, Baz as Qux } from "changed";',
        'import { Foo, Bar, Baz as Qux, } from "changed";',
        'import { Foo as Bar, Baz as Qux, Norf } from "changed";',
        'import { Foo as Bar, Baz as Qux, Norf, } from "changed";',
        'import { Foo as Bar, Baz, Qux as Norf } from "changed";',
        'import { Foo as Bar, Baz, Qux as Norf, } from "changed";',
        'import { Foo, Bar as Baz, Qux as Norf } from "changed";',
        'import { Foo, Bar as Baz, Qux as Norf, } from "changed";',
        'import { Foo as Bar, Baz as Qux, Norf as NoMore } from "changed";',
        'import { Foo as Bar, Baz as Qux, Norf as NoMore, } from "changed";',
        'import Default, * as All from "changed";',
        'import Default, { } from "changed";',
        'import Default, { Foo } from "changed";',
        'import Default, { Foo, } from "changed";',
        'import Default, { Foo as Bar } from "changed";',
        'import Default, { Foo as Bar, } from "changed";',
        'import Default, { Foo, Bar } from "changed";',
        'import Default, { Foo, Bar, } from "changed";',
        'import Default, { Foo as Bar, Baz } from "changed";',
        'import Default, { Foo as Bar, Baz, } from "changed";',
        'import Default, { Foo, Bar as Baz } from "changed";',
        'import Default, { Foo, Bar as Baz, } from "changed";',
        'import Default, { Foo as Bar, Baz as Qux } from "changed";',
        'import Default, { Foo as Bar, Baz as Qux, } from "changed";',
        'import Default, { Foo, Bar, Baz } from "changed";',
        'import Default, { Foo, Bar, Baz, } from "changed";',
        'import Default, { Foo as Bar, Baz, Qux } from "changed";',
        'import Default, { Foo as Bar, Baz, Qux, } from "changed";',
        'import Default, { Foo, Bar as Baz, Qux } from "changed";',
        'import Default, { Foo, Bar as Baz, Qux, } from "changed";',
        'import Default, { Foo, Bar, Baz as Qux } from "changed";',
        'import Default, { Foo, Bar, Baz as Qux, } from "changed";',
        'import Default, { Foo as Bar, Baz as Qux, Norf } from "changed";',
        'import Default, { Foo as Bar, Baz as Qux, Norf, } from "changed";',
        'import Default, { Foo as Bar, Baz, Qux as Norf } from "changed";',
        'import Default, { Foo as Bar, Baz, Qux as Norf, } from "changed";',
        'import Default, { Foo, Bar as Baz, Qux as Norf } from "changed";',
        'import Default, { Foo, Bar as Baz, Qux as Norf, } from "changed";',
        'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "changed";',
        'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "changed";',
        'import Default from "Y";',
        'import * as All from \'z\';',
        'require("changed")',
        'require("Y")',
        'require( \'z\' )',
        'require( "a")',
        'require("b" )});',
      ].join('\n'));
    });
  });
});
