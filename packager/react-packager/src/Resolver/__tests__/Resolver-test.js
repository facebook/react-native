/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.unmock('../');
jest.mock('path');


const DependencyGraph = jest.fn();
jest.setMock('../../node-haste', DependencyGraph);
let Module;
let Polyfill;

describe('Resolver', function() {
  let Resolver, path;

  beforeEach(function() {
    Resolver = require('../');
    path = require('path');
    DependencyGraph.mockClear();
    Module = jest.fn(function() {
      this.getName = jest.fn();
      this.getDependencies = jest.fn();
      this.isPolyfill = jest.fn().mockReturnValue(false);
      this.isJSON = jest.fn().mockReturnValue(false);
    });
    Polyfill = jest.fn(function() {
      var polyfill = new Module();
      polyfill.isPolyfill.mockReturnValue(true);
      return polyfill;
    });

    DependencyGraph.replacePatterns = require.requireActual('../../node-haste/lib/replacePatterns');
    DependencyGraph.prototype.createPolyfill = jest.fn();
    DependencyGraph.prototype.getDependencies = jest.fn();

    // For the polyfillDeps
    path.join = jest.fn((a, b) => b);

    DependencyGraph.prototype.load = jest.fn(() => Promise.resolve());
  });

  class ResolutionResponseMock {
    constructor({dependencies, mainModuleId}) {
      this.dependencies = dependencies;
      this.mainModuleId = mainModuleId;
      this.getModuleId = createGetModuleId();
    }

    prependDependency(dependency) {
      this.dependencies.unshift(dependency);
    }

    finalize() {
      return Promise.resolve(this);
    }

    getResolvedDependencyPairs() {
      return [];
    }
  }

  function createModule(id, dependencies) {
    var module = new Module({});
    module.path = id;
    module.getName.mockImpl(() => Promise.resolve(id));
    module.getDependencies.mockImpl(() => Promise.resolve(dependencies));
    return module;
  }

  function createJsonModule(id) {
    const module = createModule(id, []);
    module.isJSON.mockReturnValue(true);
    return module;
  }

  function createPolyfill(id, dependencies) {
    var polyfill = new Polyfill({});
    polyfill.getName = jest.fn(() => Promise.resolve(id));
    polyfill.getDependencies =
      jest.fn(() => Promise.resolve(dependencies));
    return polyfill;
  }

  describe('getDependencies', function() {
    it('forwards transform options to the dependency graph', function() {
      const transformOptions = {arbitrary: 'options'};
      const platform = 'ios';
      const entry = '/root/index.js';

      DependencyGraph.prototype.getDependencies.mockImplementation(
        () => Promise.reject());
      new Resolver({projectRoot: '/root'})
        .getDependencies(entry, {platform}, transformOptions);
      expect(DependencyGraph.prototype.getDependencies).toBeCalledWith({
        entryPath: entry,
        platform: platform,
        transformOptions: transformOptions,
        recursive: true,
      });
    });

    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
        }));
      });

      return depResolver
        .getDependencies(
          '/root/index.js',
          { dev: false },
          undefined,
          undefined,
          createGetModuleId()
        ).then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(result.dependencies[result.dependencies.length - 1]).toBe(module);
          expect(
            DependencyGraph
              .prototype
              .createPolyfill
              .mock
              .calls
              .map((call) => call[0]))
          .toEqual([
            { id: 'polyfills/polyfills.js',
              file: 'polyfills/polyfills.js',
              dependencies: []
            },
            { id: 'polyfills/console.js',
              file: 'polyfills/console.js',
              dependencies: [
                'polyfills/polyfills.js'
              ],
            },
            { id: 'polyfills/error-guard.js',
              file: 'polyfills/error-guard.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js'
              ],
            },
            { id: 'polyfills/Number.es6.js',
              file: 'polyfills/Number.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js'
              ],
            },
            { id: 'polyfills/String.prototype.es6.js',
              file: 'polyfills/String.prototype.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/Number.es6.js',
              ],
            },
            { id: 'polyfills/Array.prototype.es6.js',
              file: 'polyfills/Array.prototype.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/Number.es6.js',
                'polyfills/String.prototype.es6.js',
              ],
            },
            { id: 'polyfills/Array.es6.js',
              file: 'polyfills/Array.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/Number.es6.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
              ],
            },
            { id: 'polyfills/Object.es7.js',
              file: 'polyfills/Object.es7.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/Number.es6.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
              ],
            },
            { id: 'polyfills/babelHelpers.js',
              file: 'polyfills/babelHelpers.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/Number.es6.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
                'polyfills/Object.es7.js',
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
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
        }));
      });

      const polyfill = {};
      DependencyGraph.prototype.createPolyfill.mockReturnValueOnce(polyfill);
      return depResolver
        .getDependencies(
          '/root/index.js',
          { dev: true },
          undefined,
          undefined,
          createGetModuleId()
        ).then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(DependencyGraph.mock.instances[0].getDependencies)
              .toBeCalledWith({entryPath: '/root/index.js', recursive: true});
          expect(result.dependencies[0]).toBe(polyfill);
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
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
        }));
      });

      return depResolver
        .getDependencies(
          '/root/index.js',
          { dev: false },
          undefined,
          undefined,
          createGetModuleId()
        ).then((result) => {
          expect(result.mainModuleId).toEqual('index');
          expect(DependencyGraph.prototype.createPolyfill.mock.calls[result.dependencies.length - 2]).toEqual([
            { file: 'some module',
              id: 'some module',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/Number.es6.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
                'polyfills/Object.es7.js',
                'polyfills/babelHelpers.js',
              ]
            },
          ]);
        });
    });
  });

  describe('wrapModule', function() {
    let depResolver;
    beforeEach(() => {
      depResolver = new Resolver({
        depResolver,
        projectRoot: '/root',
      });
    });

    pit('should resolve modules', function() {
      /*eslint-disable */
      var code = [
        // require
        'require("x")',
        'require("y")',
        'require( \'z\' )',
        'require( "a")',
        'require("b" )',
      ].join('\n');
      /*eslint-disable */

      function *findDependencyOffsets() {
        const re = /(['"']).*?\1/g;
        let match;
        while ((match = re.exec(code))) {
          yield match.index;
        }
      }

      const dependencyOffsets = Array.from(findDependencyOffsets());
      const module = createModule('test module', ['x', 'y']);
      const resolutionResponse = new ResolutionResponseMock({
        dependencies: [module],
        mainModuleId: 'test module',
      });

      resolutionResponse.getResolvedDependencyPairs = (module) => {
        return [
          ['x', createModule('changed')],
          ['y', createModule('Y')],
        ];
      }

      const moduleIds = new Map(
        resolutionResponse
          .getResolvedDependencyPairs()
          .map(([importId, module]) =>
            [importId, resolutionResponse.getModuleId(module)])
      );

      return depResolver.wrapModule({
        resolutionResponse,
        module: module,
        name: 'test module',
        code,
        meta: {dependencyOffsets},
        dev: false,
      }).then(({code: processedCode}) => {
        expect(processedCode).toEqual([
          `__d(${resolutionResponse.getModuleId(module)} /* test module */, function(global, require, module, exports) {` +
          // require
          `require(${moduleIds.get('x')} /* x */)`,
          `require(${moduleIds.get('y')} /* y */)`,
          'require( \'z\' )',
          'require( "a")',
          'require("b" )',
          '});',
        ].join('\n'));
      });
    });

    pit('should add module transport names as third argument to `__d`', () => {
      const module = createModule('test module');
      const code = 'arbitrary(code)'
      const resolutionResponse = new ResolutionResponseMock({
        dependencies: [module],
        mainModuleId: 'test module',
      });
      return depResolver.wrapModule({
        resolutionResponse,
        code,
        module,
        name: 'test module',
        dev: true,
      }).then(({code: processedCode}) =>
        expect(processedCode).toEqual([
          `__d(${resolutionResponse.getModuleId(module)} /* test module */, function(global, require, module, exports) {` +
            code,
          '}, "test module");'
        ].join('\n'))
      );
    });

    pit('should pass through passed-in source maps', () => {
      const module = createModule('test module');
      const resolutionResponse = new ResolutionResponseMock({
        dependencies: [module],
        mainModuleId: 'test module',
      });
      const inputMap = {version: 3, mappings: 'ARBITRARY'};
      return depResolver.wrapModule({
        resolutionResponse,
        module,
        name: 'test module',
        code: 'arbitrary(code)',
        map: inputMap,
      }).then(({map}) => expect(map).toBe(inputMap));
    });

    pit('should resolve polyfills', function () {
      const depResolver = new Resolver({
        projectRoot: '/root',
      });
      const polyfill = createPolyfill('test polyfill', []);
      const code = [
        'global.fetch = () => 1;',
      ].join('');
      return depResolver.wrapModule({
        module: polyfill,
        code
      }).then(({code: processedCode}) => {
        expect(processedCode).toEqual([
          '(function(global) {',
          'global.fetch = () => 1;',
          "\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);",
        ].join(''));
      });
    });

    describe('JSON files:', () => {
      const code = JSON.stringify({arbitrary: "data"});
      const id = 'arbitrary.json';
      let depResolver, module, resolutionResponse;

      beforeEach(() => {
        depResolver = new Resolver({projectRoot: '/root'});
        module = createJsonModule(id);
        resolutionResponse = new ResolutionResponseMock({
          dependencies: [module],
          mainModuleId: id,
        });
      });

      pit('should prefix JSON files with `module.exports=`', () => {
        return depResolver
          .wrapModule({resolutionResponse, module, name: id, code, dev: false})
          .then(({code: processedCode}) =>
            expect(processedCode).toEqual([
              `__d(${resolutionResponse.getModuleId(module)} /* ${id} */, function(global, require, module, exports) {`,
              `module.exports = ${code}\n});`,
            ].join('')));
      });
    });

    describe('minification:', () => {
      const code ='arbitrary(code)';
      const id = 'arbitrary.js';
      let depResolver, minifyCode, module, resolutionResponse, sourceMap;

      beforeEach(() => {
        minifyCode = jest.fn((filename, code, map) =>
          Promise.resolve({code, map}));
        depResolver = new Resolver({
          projectRoot: '/root',
          minifyCode,
        });
        module = createModule(id);
        module.path = '/arbitrary/path.js';
        resolutionResponse = new ResolutionResponseMock({
          dependencies: [module],
          mainModuleId: id,
        });
        sourceMap = {version: 3, sources: ['input'], mappings: 'whatever'};
      });

      pit('should invoke the minifier with the wrapped code', () => {
        const wrappedCode = `__d(${resolutionResponse.getModuleId(module)} /* ${id} */, function(global, require, module, exports) {${code}\n});`
        return depResolver
          .wrapModule({
            resolutionResponse,
            module,
            name: id,
            code,
            map: sourceMap,
            minify: true,
            dev: false,
          }).then(() => {
            expect(minifyCode).toBeCalledWith(module.path, wrappedCode, sourceMap);
          });
      });

      pit('should use minified code', () => {
        const minifiedCode = 'minified(code)';
        const minifiedMap = {version: 3, file: ['minified']};
        minifyCode.mockReturnValue(Promise.resolve({code: minifiedCode, map: minifiedMap}));
        return depResolver
          .wrapModule({resolutionResponse, module, name: id, code, minify: true})
          .then(({code, map}) => {
            expect(code).toEqual(minifiedCode);
            expect(map).toEqual(minifiedMap);
          });
      });
    });
  });

  function createGetModuleId() {
    let nextId = 1;
    const knownIds = new Map();
    function createId(path) {
      const id = nextId;
      nextId += 1;
      knownIds.set(path, id);
      return id;
    }

    return ({path}) => knownIds.get(path) || createId(path);
  }
});
