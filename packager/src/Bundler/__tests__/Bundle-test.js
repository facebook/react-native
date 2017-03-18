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

const Bundle = require('../Bundle');
const ModuleTransport = require('../../lib/ModuleTransport');
const crypto = require('crypto');

describe('Bundle', () => {
  var bundle;

  beforeEach(() => {
    bundle = new Bundle({sourceMapUrl: 'test_url'});
    bundle.getSourceMap = jest.fn(() => {
      return 'test-source-map';
    });
  });

  describe('source bundle', () => {
    it('should create a bundle and get the source', () => {
      return Promise.resolve().then(() => {
        return addModule({
          bundle,
          code: 'transformed foo;',
          sourceCode: 'source foo',
          sourcePath: 'foo path',
        });
      }).then(() => {
        return addModule({
          bundle,
          code: 'transformed bar;',
          sourceCode: 'source bar',
          sourcePath: 'bar path',
        });
      }).then(() => {
        bundle.finalize({});
        expect(bundle.getSource({dev: true})).toBe([
          'transformed foo;',
          'transformed bar;',
          '\/\/# sourceMappingURL=test_url',
        ].join('\n'));
      });
    });

    it('should be ok to leave out the source map url', () => {
      const otherBundle = new Bundle();
      return Promise.resolve().then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'transformed foo;',
          sourceCode: 'source foo',
          sourcePath: 'foo path',
        });
      }).then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'transformed bar;',
          sourceCode: 'source bar',
          sourcePath: 'bar path',
        });
      }).then(() => {
        otherBundle.finalize({});
        expect(otherBundle.getSource({dev: true})).toBe([
          'transformed foo;',
          'transformed bar;',
        ].join('\n'));
      });
    });

    it('should create a bundle and add run module code', () => {
      return Promise.resolve().then(() => {
        return addModule({
          bundle,
          code: 'transformed foo;',
          sourceCode: 'source foo',
          sourcePath: 'foo path',
        });
      }).then(() => {
        return addModule({
          bundle,
          code: 'transformed bar;',
          sourceCode: 'source bar',
          sourcePath: 'bar path',
        });
      }).then(() => {
        bundle.setMainModuleId('foo');
        bundle.finalize({
          runBeforeMainModule: ['bar'],
          runModule: true,
        });
        expect(bundle.getSource({dev: true})).toBe([
          'transformed foo;',
          'transformed bar;',
          ';require("bar");',
          ';require("foo");',
          '\/\/# sourceMappingURL=test_url',
        ].join('\n'));
      });
    });

    it('inserts modules in a deterministic order, independent of timing of the wrapper process',
      () => {
        const moduleTransports = [
          createModuleTransport({name: 'module1'}),
          createModuleTransport({name: 'module2'}),
          createModuleTransport({name: 'module3'}),
        ];

        const resolves = {};
        const resolver = {
          wrapModule({name}) {
            return new Promise(resolve => {
              resolves[name] = resolve;
            });
          },
        };

        const promise = Promise.all(moduleTransports.map(
          m => bundle.addModule(resolver, null, {isPolyfill: () => false}, m)
        )).then(() => {
          expect(bundle.getModules())
            .toEqual(moduleTransports);
        });

        resolves.module2({code: ''});
        resolves.module3({code: ''});
        resolves.module1({code: ''});

        return promise;
      },
    );
  });

  describe('sourcemap bundle', () => {
    it('should create sourcemap', () => {
      //TODO: #15357872 add a meaningful test here
    });

    it('should combine sourcemaps', () => {
      const otherBundle = new Bundle({sourceMapUrl: 'test_url'});

      return Promise.resolve().then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'transformed foo;\n',
          sourceCode: 'source foo',
          map: {name: 'sourcemap foo'},
          sourcePath: 'foo path',
        });
      }).then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'transformed bar;\n',
          sourceCode: 'source bar',
          map: {name: 'sourcemap bar'},
          sourcePath: 'bar path',
        });
      }).then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'image module;\nimage module;',
          virtual: true,
          sourceCode: 'image module;\nimage module;',
          sourcePath: 'image.png',
        });
      }).then(() => {
        otherBundle.setMainModuleId('foo');
        otherBundle.finalize({
          runBeforeMainModule: ['InitializeCore'],
          runModule: true,
        });

        const sourceMap = otherBundle.getSourceMap({dev: true});
        expect(sourceMap).toEqual({
          file: 'test_url',
          version: 3,
          sections: [
            {offset: {line: 0, column: 0}, map: {name: 'sourcemap foo'}},
            {offset: {line: 2, column: 0}, map: {name: 'sourcemap bar'}},
            {
              offset: {
                column: 0,
                line: 4,
              },
              map: {
                file: 'image.png',
                mappings: 'AAAA;AACA;',
                names: [],
                sources: ['image.png'],
                sourcesContent: ['image module;\nimage module;'],
                version: 3,
              },
            },
            {
              offset: {
                column: 0,
                line: 6,
              },
              map: {
                file: 'require-InitializeCore.js',
                mappings: 'AAAA;',
                names: [],
                sources: ['require-InitializeCore.js'],
                sourcesContent: [';require("InitializeCore");'],
                version: 3,
              },
            },
            {
              offset: {
                column: 0,
                line: 7,
              },
              map: {
                file: 'require-foo.js',
                mappings: 'AAAA;',
                names: [],
                sources: ['require-foo.js'],
                sourcesContent: [';require("foo");'],
                version: 3,
              },
            },
          ],
        });
      });
    });
  });

  describe('getAssets()', () => {
    it('should save and return asset objects', () => {
      var p = new Bundle({sourceMapUrl: 'test_url'});
      var asset1 = {};
      var asset2 = {};
      p.addAsset(asset1);
      p.addAsset(asset2);
      p.finalize();
      expect(p.getAssets()).toEqual([asset1, asset2]);
    });
  });

  describe('getJSModulePaths()', () => {
    it('should return module paths', () => {
      var otherBundle = new Bundle({sourceMapUrl: 'test_url'});
      return Promise.resolve().then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'transformed foo;\n',
          sourceCode: 'source foo',
          sourcePath: 'foo path',
        });
      }).then(() => {
        return addModule({
          bundle: otherBundle,
          code: 'image module;\nimage module;',
          virtual: true,
          sourceCode: 'image module;\nimage module;',
          sourcePath: 'image.png',
        });
      }).then(() => {
        expect(otherBundle.getJSModulePaths()).toEqual(['foo path']);
      });
    });
  });

  describe('getEtag()', function() {
    it('should return an etag', function() {
      bundle.finalize({});
      var eTag = crypto.createHash('md5').update(bundle.getSource()).digest('hex');
      expect(bundle.getEtag()).toEqual(eTag);
    });
  });

  describe('main module id:', function() {
    it('can save a main module ID', function() {
      const id = 'arbitrary module ID';
      bundle.setMainModuleId(id);
      expect(bundle.getMainModuleId()).toEqual(id);
    });
  });

  describe('random access bundle groups:', () => {
    let moduleTransports;
    beforeEach(() => {
      moduleTransports = [
        transport('Product1', ['React', 'Relay']),
        transport('React', ['ReactFoo', 'ReactBar']),
        transport('ReactFoo', ['invariant']),
        transport('invariant', []),
        transport('ReactBar', ['cx']),
        transport('cx', []),
        transport('OtherFramework', ['OtherFrameworkFoo', 'OtherFrameworkBar']),
        transport('OtherFrameworkFoo', ['invariant']),
        transport('OtherFrameworkBar', ['crc32']),
        transport('crc32', ['OtherFrameworkBar']),
      ];
    });

    it('can create a single group', () => {
      bundle = createBundle([fsLocation('React')]);
      const {groups} = bundle.getUnbundle();
      expect(groups).toEqual(new Map([
        [idFor('React'), new Set(['ReactFoo', 'invariant', 'ReactBar', 'cx'].map(idFor))],
      ]));
    });

    it('can create two groups', () => {
      bundle = createBundle([fsLocation('ReactFoo'), fsLocation('ReactBar')]);
      const {groups} = bundle.getUnbundle();
      expect(groups).toEqual(new Map([
        [idFor('ReactFoo'), new Set([idFor('invariant')])],
        [idFor('ReactBar'), new Set([idFor('cx')])],
      ]));
    });

    it('can handle circular dependencies', () => {
      bundle = createBundle([fsLocation('OtherFramework')]);
      const {groups} = bundle.getUnbundle();
      expect(groups).toEqual(new Map([[
        idFor('OtherFramework'),
        new Set(['OtherFrameworkFoo', 'invariant', 'OtherFrameworkBar', 'crc32'].map(idFor)),
      ]]));
    });

    it('omits modules that are contained by more than one group', () => {
      bundle = createBundle([fsLocation('React'), fsLocation('OtherFramework')]);
      const {groups} = bundle.getUnbundle();
      expect(groups).toEqual(new Map([
        [idFor('React'),
          new Set(['ReactFoo', 'ReactBar', 'cx'].map(idFor))],
        [idFor('OtherFramework'),
          new Set(['OtherFrameworkFoo', 'OtherFrameworkBar', 'crc32'].map(idFor))],
      ]));
    });

    it('ignores missing dependencies', () => {
      bundle = createBundle([fsLocation('Product1')]);
      const {groups} = bundle.getUnbundle();
      expect(groups).toEqual(new Map([[
        idFor('Product1'),
        new Set(['React', 'ReactFoo', 'invariant', 'ReactBar', 'cx'].map(idFor)),
      ]]));
    });

    it('throws for group roots that do not exist', () => {
      bundle = createBundle([fsLocation('DoesNotExist')]);
      expect(() => {
        const {groups} = bundle.getUnbundle(); //eslint-disable-line no-unused-vars
      }).toThrow(new Error(`Group root ${fsLocation('DoesNotExist')} is not part of the bundle`));
    });

    function idFor(name) {
      const {map} = idFor;
      if (!map) {
        idFor.map = new Map([[name, 0]]);
        idFor.next = 1;
        return 0;
      }

      if (map.has(name)) {
        return map.get(name);
      }

      const id = idFor.next++;
      map.set(name, id);
      return id;
    }
    function createBundle(ramGroups, options = {}) {
      const b = new Bundle(Object.assign(options, {ramGroups}));
      moduleTransports.forEach(t => addModule({bundle: b, ...t}));
      b.finalize();
      return b;
    }
    function fsLocation(name) {
      return `/fs/${name}.js`;
    }
    function module(name) {
      return {path: fsLocation(name)};
    }
    function transport(name, deps) {
      return createModuleTransport({
        name,
        id: idFor(name),
        sourcePath: fsLocation(name),
        meta: {dependencyPairs: deps.map(d => [d, module(d)])},
      });
    }
  });
});

function resolverFor(code, map) {
  return {
    wrapModule: () => Promise.resolve({code, map}),
  };
}

function addModule({bundle, code, sourceCode, sourcePath, map, virtual, polyfill, meta, id = ''}) {
  return bundle.addModule(
    resolverFor(code, map),
    null,
    {isPolyfill: () => polyfill},
    createModuleTransport({
      code,
      sourceCode,
      sourcePath,
      id,
      map,
      meta,
      virtual,
      polyfill,
    }),
  );
}

function createModuleTransport(data) {
  return new ModuleTransport({
    code: '',
    sourceCode: '',
    sourcePath: '',
    id: 'id' in data ? data.id : '',
    ...data,
  });
}
