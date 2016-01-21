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
  .dontMock('PixelRatio')
  .dontMock('../../DependencyResolver/lib/extractRequires')
  .dontMock('../../DependencyResolver/lib/replacePatterns');

jest.mock('path');

var Promise = require('promise');
var Resolver = require('../');
var Module = require('../../DependencyResolver/Module');
var Polyfill = require('../../DependencyResolver/Polyfill');
var DependencyGraph = require('../../DependencyResolver/DependencyGraph');

var path = require('path');
var _ = require('underscore');

describe('Resolver', function() {
  beforeEach(function() {
    Polyfill.mockClear();

    // For the polyfillDeps
    path.join.mockImpl(function(a, b) {
      return b;
    });
  });

  const modulesWithIds = [];
  function getModuleId(module) {
    const index = modulesWithIds.indexOf(module);
    return String(index !== -1 ? index + 1 : modulesWithIds.push(module));
  }

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
    var module = new Module({});
    module.getName.mockImpl(() => Promise.resolve(id));
    module.getDependencies.mockImpl(() => Promise.resolve(dependencies));
    return module;
  }

  function createPolyfill(id, dependencies) {
    var polyfill = new Polyfill({});
    polyfill.getName.mockImpl(() => Promise.resolve(id));
    polyfill.getDependencies.mockImpl(() => Promise.resolve(dependencies));
    polyfill.isPolyfill.mockReturnValue(true);
    return polyfill;
  }

  describe('getDependencies', function() {
    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
        getModuleId,
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
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
            { path: 'polyfills/polyfills.js',
              id: 'polyfills/polyfills.js',
              isPolyfill: true,
              dependencies: []
            },
            { id: 'polyfills/console.js',
              isPolyfill: true,
              path: 'polyfills/console.js',
              dependencies: [
                'polyfills/polyfills.js'
              ],
            },
            { id: 'polyfills/error-guard.js',
              isPolyfill: true,
              path: 'polyfills/error-guard.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js'
              ],
            },
            { id: 'polyfills/String.prototype.es6.js',
              isPolyfill: true,
              path: 'polyfills/String.prototype.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js'
              ],
            },
            { id: 'polyfills/Array.prototype.es6.js',
              isPolyfill: true,
              path: 'polyfills/Array.prototype.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
              ],
            },
            { id: 'polyfills/Array.es6.js',
              isPolyfill: true,
              path: 'polyfills/Array.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
              ],
            },
            { id: 'polyfills/babelHelpers.js',
              isPolyfill: true,
              path: 'polyfills/babelHelpers.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
              ],
            },
          ]);
        });
    });

    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
        getModuleId,
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
          asyncDependencies: [],
        }));
      });

      return depResolver.getDependencies('/root/index.js', { dev: true })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(DependencyGraph.mock.instances[0].getDependencies).toBeCalledWith('/root/index.js', undefined);
          expect(result.dependencies[0]).toBe(Polyfill.mock.instances[0]);
          expect(result.dependencies[result.dependencies.length - 1])
              .toBe(module);
        });
    });

    pit('should pass in more polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
        polyfillModuleNames: ['some module'],
        getModuleId,
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
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
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
                'polyfills/babelHelpers.js',
              ]
            },
          ]);
        });
    });
  });

  describe('wrapModule', function() {
    pit('should resolve modules', function() {
      var depResolver = new Resolver({
        projectRoot: '/root',
        getModuleId,
      });

      const magicJoiner = '\n\n\n';

      /*eslint-disable */
      const testCases = [
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
        'import{Foo}from"x";',
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
        // single line export
        "export'x';",
        "export 'x';",
        "export 'x' ;",
        "export Default from 'x';",
        "export * as All from 'x';",
        "export {} from 'x';",
        "export { } from 'x';",
        "export {Foo} from 'x';",
        "export { Foo } from 'x';",
        "export{Foo}from'x';",
        "export { Foo, } from 'x';",
        "export {Foo as Bar} from 'x';",
        "export { Foo as Bar } from 'x';",
        "export { Foo as Bar, } from 'x';",
        "export { Foo, Bar } from 'x';",
        "export { Foo, Bar, } from 'x';",
        "export { Foo as Bar, Baz } from 'x';",
        "export { Foo as Bar, Baz, } from 'x';",
        "export { Foo, Bar as Baz } from 'x';",
        "export { Foo, Bar as Baz, } from 'x';",
        "export { Foo as Bar, Baz as Qux } from 'x';",
        "export { Foo as Bar, Baz as Qux, } from 'x';",
        "export { Foo, Bar, Baz } from 'x';",
        "export { Foo, Bar, Baz, } from 'x';",
        "export { Foo as Bar, Baz, Qux } from 'x';",
        "export { Foo as Bar, Baz, Qux, } from 'x';",
        "export { Foo, Bar as Baz, Qux } from 'x';",
        "export { Foo, Bar as Baz, Qux, } from 'x';",
        "export { Foo, Bar, Baz as Qux } from 'x';",
        "export { Foo, Bar, Baz as Qux, } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "export { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "export { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "export { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "export { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf as Enuf } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'x';",
        "export Default, * as All from 'x';",
        "export Default, { } from 'x';",
        "export Default, { Foo } from 'x';",
        "export Default, { Foo, } from 'x';",
        "export Default, { Foo as Bar } from 'x';",
        "export Default, { Foo as Bar, } from 'x';",
        "export Default, { Foo, Bar } from 'x';",
        "export Default, { Foo, Bar, } from 'x';",
        "export Default, { Foo as Bar, Baz } from 'x';",
        "export Default, { Foo as Bar, Baz, } from 'x';",
        "export Default, { Foo, Bar as Baz } from 'x';",
        "export Default, { Foo, Bar as Baz, } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, } from 'x';",
        "export Default, { Foo, Bar, Baz } from 'x';",
        "export Default, { Foo, Bar, Baz, } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux, } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux, } from 'x';",
        "export Default, { Foo, Bar, Baz as Qux } from 'x';",
        "export Default, { Foo, Bar, Baz as Qux, } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'x';",
        "export Default , { } from 'x';",
        'export "x";',
        'export Default from "x";',
        'export * as All from "x";',
        'export { } from "x";',
        'export { Foo } from "x";',
        'export { Foo, } from "x";',
        'export { Foo as Bar } from "x";',
        'export { Foo as Bar, } from "x";',
        'export { Foo, Bar } from "x";',
        'export { Foo, Bar, } from "x";',
        'export { Foo as Bar, Baz } from "x";',
        'export { Foo as Bar, Baz, } from "x";',
        'export { Foo, Bar as Baz } from "x";',
        'export { Foo, Bar as Baz, } from "x";',
        'export { Foo as Bar, Baz as Qux } from "x";',
        'export { Foo as Bar, Baz as Qux, } from "x";',
        'export { Foo, Bar, Baz } from "x";',
        'export { Foo, Bar, Baz, } from "x";',
        'export { Foo as Bar, Baz, Qux } from "x";',
        'export { Foo as Bar, Baz, Qux, } from "x";',
        'export { Foo, Bar as Baz, Qux } from "x";',
        'export { Foo, Bar as Baz, Qux, } from "x";',
        'export { Foo, Bar, Baz as Qux } from "x";',
        'export { Foo, Bar, Baz as Qux, } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'export { Foo as Bar, Baz, Qux as Norf } from "x";',
        'export { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'export { Foo, Bar as Baz, Qux as Norf } from "x";',
        'export { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf as NoMore } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf as NoMore, } from "x";',
        'export Default, * as All from "x";',
        'export Default, { } from "x";',
        'export Default, { Foo } from "x";',
        'export Default, { Foo, } from "x";',
        'export Default, { Foo as Bar } from "x";',
        'export Default, { Foo as Bar, } from "x";',
        'export Default, { Foo, Bar } from "x";',
        'export Default, { Foo, Bar, } from "x";',
        'export Default, { Foo as Bar, Baz } from "x";',
        'export Default, { Foo as Bar, Baz, } from "x";',
        'export Default, { Foo, Bar as Baz } from "x";',
        'export Default, { Foo, Bar as Baz, } from "x";',
        'export Default, { Foo as Bar, Baz as Qux } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, } from "x";',
        'export Default, { Foo, Bar, Baz } from "x";',
        'export Default, { Foo, Bar, Baz, } from "x";',
        'export Default, { Foo as Bar, Baz, Qux } from "x";',
        'export Default, { Foo as Bar, Baz, Qux, } from "x";',
        'export Default, { Foo, Bar as Baz, Qux } from "x";',
        'export Default, { Foo, Bar as Baz, Qux, } from "x";',
        'export Default, { Foo, Bar, Baz as Qux } from "x";',
        'export Default, { Foo, Bar, Baz as Qux, } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'export Default, { Foo as Bar, Baz, Qux as Norf } from "x";',
        'export Default, { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'export Default, { Foo, Bar as Baz, Qux as Norf } from "x";',
        'export Default, { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "x";',
        'export Default from "y";',
        'export * as All from \'z\';',
        // export with support for new lines
        "export { Foo,\n Bar }\n from 'x';",
        "export { \nFoo,\nBar,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz\n }\n from 'x';",
        "export { \nFoo as Bar,\n Baz\n, }\n from 'x';",
        "export { Foo,\n Bar as Baz\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "export { Foo,\n Bar,\n Baz }\n from 'x';",
        "export { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "export { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "export { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'x';",
        "export Default,\n * as All from 'x';",
        "export Default,\n { } from 'x';",
        "export Default,\n { Foo\n }\n from 'x';",
        "export Default,\n { Foo,\n }\n from 'x';",
        "export Default,\n { Foo as Bar\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar\n } from\n 'x';",
        "export Default,\n { Foo,\n Bar,\n } from\n 'x';",
        "export Default,\n { Foo as Bar,\n Baz\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'x';",
        "export Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'x';",
        "export Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'x';",
        "export Default\n , { } from 'x';",
        // require
        'require("x")',
        'require("y")',
        'require( \'z\' )',
        'require( "a")',
        'require("b" )',
      ]
      /*eslint-disable */
      const code = testCases.join(magicJoiner);

      const module = createModule('test module', ['x', 'y']);

      const resolutionResponse = new ResolutionResponseMock({
        dependencies: [module],
        mainModuleId: 'test module',
        asyncDependencies: [],
      });

      const pairs = [
        ['x', createModule('changed')],
        ['y', createModule('Y')],
      ];
      resolutionResponse.getResolvedDependencyPairs = () => pairs;

      function makeExpected(code) {
        return pairs
          .reduce((code, [id, module]) =>
            code.replace(
              RegExp(`(['"])${id}\\1`),
              (_, quot) => `${quot}${getModuleId(module)}${quot} /* ${id} */`
            ),
            code
          );
      }

      return depResolver.wrapModule(
        resolutionResponse,
        createModule('test module', ['x', 'y']),
        code
      ).then(processedCode => {
        expect(processedCode.name).toEqual('test module');

        // extract the converted code from the module wrapper
        const cases =
          processedCode.code
            .match(/__d\(.*?\{\s*([\s\S]*)\}/)[1] // match code in wrapper
            .replace(/\s+$/, '') // remove trailing whitespace
            .split(magicJoiner); // extract every tested case

        testCases.forEach((inputCode, i) => {
          expect(cases[i]).toEqual(makeExpected(inputCode));
          if(cases[i]!==makeExpected(inputCode)) {
            console.log('FAIL %s: input(%s) expected(%s) actual(%s)', i, inputCode, makeExpected(inputCode), cases[i]);
          }
        });
      });
    });

    pit('should resolve polyfills', function () {
      const depResolver = new Resolver({
        projectRoot: '/root',
      });
      const polyfill = createPolyfill('test polyfill', []);
      const code = [
        'global.fetch = () => 1;',
      ].join('');
      return depResolver.wrapModule(
        null,
        polyfill,
        code
      ).then(processedCode => {
        expect(processedCode.code).toEqual([
          '(function(global) {',
          'global.fetch = () => 1;',
          "\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);",
        ].join(''));
      });
    });
  });
});
