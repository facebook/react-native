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

const Bundle = require('../Bundle');
const ModuleTransport = require('../../lib/ModuleTransport');
const Promise = require('Promise');
const SourceMapGenerator = require('source-map').SourceMapGenerator;
const UglifyJS = require('uglify-js');
const crypto = require('crypto');

describe('Bundle', () => {
  var bundle;

  beforeEach(() => {
    bundle = new Bundle('test_url');
    bundle.getSourceMap = jest.genMockFn().mockImpl(() => {
      return 'test-source-map';
    });
  });

  describe('source bundle', () => {
    pit('should create a bundle and get the source', () => {
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
          '\/\/# sourceMappingURL=test_url'
        ].join('\n'));
      });
    });

    pit('should be ok to leave out the source map url', () => {
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

    pit('should create a bundle and add run module code', () => {
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
          runMainModule: true,
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

    pit('should get minified source', () => {
      const minified = {
        code: 'minified',
        map: 'map',
      };

      UglifyJS.minify = function() {
        return minified;
      };

      return Promise.resolve().then(() => {
        return addModule({
          bundle,
          code: 'transformed foo;',
          sourceCode: 'source foo',
          sourcePath: 'foo path',
        });
      }).then(() => {
        bundle.finalize();
        expect(bundle.getMinifiedSourceAndMap({dev: true})).toBe(minified);
      });
    });
  });

  describe('sourcemap bundle', () => {
    pit('should create sourcemap', () => {
      const otherBundle = new Bundle('test_url');

      return Promise.resolve().then(() => {
        return addModule({
          bundle: otherBundle,
          code: [
            'transformed foo',
            'transformed foo',
            'transformed foo',
          ].join('\n'),
          sourceCode: [
            'source foo',
            'source foo',
            'source foo',
          ].join('\n'),
          sourcePath: 'foo path',
        });
      }).then(() => {
        return addModule({
          bundle: otherBundle,
          code: [
            'transformed bar',
            'transformed bar',
            'transformed bar',
          ].join('\n'),
          sourceCode: [
            'source bar',
            'source bar',
            'source bar',
          ].join('\n'),
          sourcePath: 'bar path',
        });
      }).then(() => {
        otherBundle.setMainModuleId('foo');
        otherBundle.finalize({
          runBeforeMainModule: [],
          runMainModule: true,
        });
        const sourceMap = otherBundle.getSourceMap({dev: true});
        expect(sourceMap).toEqual(genSourceMap(otherBundle.getModules()));
      });
    });

    pit('should combine sourcemaps', () => {
      const otherBundle = new Bundle('test_url');

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
          runBeforeMainModule: ['InitializeJavaScriptAppEngine'],
          runMainModule: true,
        });

        const sourceMap = otherBundle.getSourceMap({dev: true});
        expect(sourceMap).toEqual({
          file: 'test_url',
          version: 3,
          sections: [
            { offset: { line: 0, column: 0 }, map: { name: 'sourcemap foo' } },
            { offset: { line: 2, column: 0 }, map: { name: 'sourcemap bar' } },
            {
              offset: {
                column: 0,
                line: 4
              },
              map: {
                file: 'image.png',
                mappings: 'AAAA;AACA;',
                names: [],
                sources: [ 'image.png' ],
                sourcesContent: ['image module;\nimage module;'],
                version: 3,
              }
            },
            {
              offset: {
                column: 0,
                line: 6
              },
              map: {
                file: 'require-InitializeJavaScriptAppEngine.js',
                mappings: 'AAAA;',
                names: [],
                sources: [ 'require-InitializeJavaScriptAppEngine.js' ],
                sourcesContent: [';require("InitializeJavaScriptAppEngine");'],
                version: 3,
              }
            },
            {
              offset: {
                column: 0,
                line: 7
              },
              map: {
                file: 'require-foo.js',
                mappings: 'AAAA;',
                names: [],
                sources: [ 'require-foo.js' ],
                sourcesContent: [';require("foo");'],
                version: 3,
              }
            },
          ],
        });
      });
    });
  });

  describe('getAssets()', () => {
    it('should save and return asset objects', () => {
      var p = new Bundle('test_url');
      var asset1 = {};
      var asset2 = {};
      p.addAsset(asset1);
      p.addAsset(asset2);
      p.finalize();
      expect(p.getAssets()).toEqual([asset1, asset2]);
    });
  });

  describe('getJSModulePaths()', () => {
    pit('should return module paths', () => {
      var otherBundle = new Bundle('test_url');
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
      var bundle = new Bundle('test_url');
      bundle.finalize({});
      var eTag = crypto.createHash('md5').update(bundle.getSource()).digest('hex');
      expect(bundle.getEtag()).toEqual(eTag);
    });
  });

  describe('main module name and id:', function() {
    it('keeps distinct module names and IDs', function() {
      const id = 'arbitrary module ID';
      const name = 'arbitrary module name';
      bundle.setMainModuleId(id);
      bundle.setMainModuleName(name);

      expect(bundle.getMainModuleId()).toEqual(id);
      expect(bundle.getMainModuleName()).toEqual(name);
    });

    it('can serialize and deserialize module ID and name', function() {
      const id = 'arbitrary module ID';
      const name = 'arbitrary module name';
      bundle.setMainModuleId(id);
      bundle.setMainModuleName(name);
      bundle.finalize({});

      const deserialized = Bundle.fromJSON(bundle.toJSON());

      expect(deserialized.getMainModuleId()).toEqual(id);
      expect(deserialized.getMainModuleName()).toEqual(name);
    });
  });
});


function genSourceMap(modules) {
  var sourceMapGen = new SourceMapGenerator({file: 'test_url', version: 3});
  var bundleLineNo = 0;
  for (var i = 0; i < modules.length; i++) {
    var module = modules[i];
    var transformedCode = module.code;
    var sourcePath = module.sourcePath;
    var sourceCode = module.sourceCode;
    var transformedLineCount = 0;
    var lastCharNewLine = false;
    for (var t = 0; t < transformedCode.length; t++) {
      if (t === 0 || lastCharNewLine) {
        sourceMapGen.addMapping({
          generated: {line: bundleLineNo + 1, column: 0},
          original: {line: transformedLineCount + 1, column: 0},
          source: sourcePath
        });
      }
      lastCharNewLine = transformedCode[t] === '\n';
      if (lastCharNewLine) {
        transformedLineCount++;
        bundleLineNo++;
      }
    }
    bundleLineNo++;
    sourceMapGen.setSourceContent(
      sourcePath,
      sourceCode
    );
  }
  return sourceMapGen.toJSON();
}

function resolverFor(code) {
  return {
    wrapModule: (response, module, sourceCode) => Promise.resolve(
      {name: 'name', code}
    ),
  };
}

function addModule({bundle, code, sourceCode, sourcePath, map, virtual}) {
  return bundle.addModule(
    resolverFor(code),
    null,
    null,
    {sourceCode, sourcePath, map, virtual}
  );
}
