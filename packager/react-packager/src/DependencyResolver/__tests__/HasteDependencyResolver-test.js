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
  .dontMock('underscore')
  .dontMock('../replacePatterns');

jest.mock('path');

var Promise = require('promise');
var HasteDependencyResolver = require('../');
var Module = require('../Module');
var Polyfill = require('../Polyfill');

var path = require('path');
var _ = require('underscore');

describe('HasteDependencyResolver', function() {
  beforeEach(function() {
    Polyfill.mockClear();

    // For the polyfillDeps
    path.join.mockImpl(function(a, b) {
      return b;
    });
  });

  class ResolutionResponseMock {
    constructor({dependencies, mainModuleId, asyncDependencies}) {
      this.dependencies = dependencies;
      this.mainModuleId = mainModuleId;
      this.asyncDependencies = asyncDependencies;
    }

    prependDependency(dependency) {
      this.dependencies.unshift(dependency);
    }

    finalize() {
      return Promise.resolve(this);
    }
  }

  function createModule(id, dependencies) {
    var module = new Module();
    module.getName.mockImpl(() => Promise.resolve(id));
    module.getDependencies.mockImpl(() => Promise.resolve(dependencies));
    return module;
  }

  describe('getDependencies', function() {
    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
      });

      // Is there a better way? How can I mock the prototype instead?
      var depGraph = depResolver._depGraph;
      depGraph.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
          asyncDependencies: [],
        }));
      });

      return depResolver.getDependencies('/root/index.js', { dev: false })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(result.dependencies[result.dependencies.length - 1]).toBe(module);
          expect(_.pluck(Polyfill.mock.calls, 0)).toEqual([
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
            { id: 'polyfills/String.prototype.es6.js',
              isPolyfill: true,
              path: 'polyfills/String.prototype.es6.js',
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js'
              ],
            },
            { id: 'polyfills/Array.prototype.es6.js',
              isPolyfill: true,
              path: 'polyfills/Array.prototype.es6.js',
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
              ],
            },
          ]);
        });
    });

    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
      });

      var depGraph = depResolver._depGraph;
      depGraph.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
          asyncDependencies: [],
        }));
      });

      return depResolver.getDependencies('/root/index.js', { dev: true })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(depGraph.getDependencies).toBeCalledWith('/root/index.js', undefined);
          expect(result.dependencies[0]).toBe(Polyfill.mock.instances[0]);
          expect(result.dependencies[result.dependencies.length - 1])
              .toBe(module);
        });
    });

    pit('should pass in more polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
        polyfillModuleNames: ['some module'],
      });

      var depGraph = depResolver._depGraph;
      depGraph.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
          asyncDependencies: [],
        }));
      });

      return depResolver.getDependencies('/root/index.js', { dev: false })
        .then((result) => {
          expect(result.mainModuleId).toEqual('index');
          expect(Polyfill.mock.calls[result.dependencies.length - 2]).toEqual([
            { path: 'some module',
              id: 'some module',
              isPolyfill: true,
              dependencies: [
                'polyfills/prelude.js',
                'polyfills/require.js',
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js'
              ]
            },
          ]);
        });
    });
  });

  describe('wrapModule', function() {
    pit('should resolve modules', function() {
      var depResolver = new HasteDependencyResolver({
        projectRoot: '/root',
      });

      var depGraph = depResolver._depGraph;
      var dependencies = ['x', 'y', 'z', 'a', 'b'];

      /*eslint-disable */
      var code = [
        // single line import
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
        // import with support for new lines
        "import { Foo,\n Bar }\n from 'x';",
        "import { \nFoo,\nBar,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz\n }\n from 'x';",
        "import { \nFoo as Bar,\n Baz\n, }\n from 'x';",
        "import { Foo,\n Bar as Baz\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "import { Foo,\n Bar,\n Baz }\n from 'x';",
        "import { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "import { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "import { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'x';",
        "import Default,\n * as All from 'x';",
        "import Default,\n { } from 'x';",
        "import Default,\n { Foo\n }\n from 'x';",
        "import Default,\n { Foo,\n }\n from 'x';",
        "import Default,\n { Foo as Bar\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar\n } from\n 'x';",
        "import Default,\n { Foo,\n Bar,\n } from\n 'x';",
        "import Default,\n { Foo as Bar,\n Baz\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'x';",
        "import Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'x';",
        "import Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'x';",
        "import Default\n , { } from 'x';",
        // require
        'require("x")',
        'require("y")',
        'require( \'z\' )',
        'require( "a")',
        'require("b" )',
      ].join('\n');
      /*eslint-disable */

      const module = createModule('test module', ['x', 'y']);

      const resolutionResponse = new ResolutionResponseMock({
        dependencies: [module],
        mainModuleId: 'test module',
        asyncDependencies: [],
      });

      resolutionResponse.getResolvedDependencyPairs = (module) => {
        return [
          ['x', createModule('changed')],
          ['y', createModule('Y')],
        ];
      }

      return depResolver.wrapModule(
        resolutionResponse,
        createModule('test module', ['x', 'y']),
        code
      ).then(processedCode => {
        expect(processedCode).toEqual([
          '__d(\'test module\',["changed","Y"],function(global, require,' +
            ' module, exports) {  ' +
            // single line import
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
          // import with support for new lines
          "import { Foo,\n Bar }\n from 'changed';",
          "import { \nFoo,\nBar,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz\n }\n from 'changed';",
          "import { \nFoo as Bar,\n Baz\n, }\n from 'changed';",
          "import { Foo,\n Bar as Baz\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux,\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux,\n }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz as Qux\n }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'changed';",
          "import Default,\n * as All from 'changed';",
          "import Default,\n { } from 'changed';",
          "import Default,\n { Foo\n }\n from 'changed';",
          "import Default,\n { Foo,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar\n } from\n 'changed';",
          "import Default,\n { Foo,\n Bar,\n } from\n 'changed';",
          "import Default,\n { Foo as Bar,\n Baz\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'changed';",
          "import Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'changed';",
          "import Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'changed';",
          "import Default\n , { } from 'changed';",
          // require
          'require("changed")',
          'require("Y")',
          'require( \'z\' )',
          'require( "a")',
          'require("b" )',
          '});',
        ].join('\n'));
      });
    });
  });
});
