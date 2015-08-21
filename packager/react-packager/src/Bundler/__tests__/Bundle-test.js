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

var SourceMapGenerator = require('source-map').SourceMapGenerator;

describe('Bundle', function() {
  var ModuleTransport;
  var Bundle;
  var bundle;

  beforeEach(function() {
    Bundle = require('../Bundle');
    ModuleTransport = require('../../lib/ModuleTransport');
    bundle = new Bundle('test_url');
    bundle.getSourceMap = jest.genMockFn().mockImpl(function() {
      return 'test-source-map';
    });
  });

  describe('source bundle', function() {
    it('should create a bundle and get the source', function() {
      bundle.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path',
      }));
      bundle.addModule(new ModuleTransport({
        code: 'transformed bar;',
        sourceCode: 'source bar',
        sourcePath: 'bar path',
      }));

      bundle.finalize({});
      expect(bundle.getSource()).toBe([
        'transformed foo;',
        'transformed bar;',
        '\/\/@ sourceMappingURL=test_url'
      ].join('\n'));
    });

    it('should be ok to leave out the source map url', function() {
      var p = new Bundle();
      p.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path',
      }));
      p.addModule(new ModuleTransport({
        code: 'transformed bar;',
        sourceCode: 'source bar',
        sourcePath: 'bar path',
      }));

      p.finalize({});
      expect(p.getSource()).toBe([
        'transformed foo;',
        'transformed bar;',
      ].join('\n'));
    });

    it('should create a bundle and add run module code', function() {
      bundle.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));

      bundle.addModule(new ModuleTransport({
        code: 'transformed bar;',
        sourceCode: 'source bar',
        sourcePath: 'bar path'
      }));

      bundle.setMainModuleId('foo');
      bundle.finalize({runMainModule: true});
      expect(bundle.getSource()).toBe([
        'transformed foo;',
        'transformed bar;',
        ';require("foo");',
        '\/\/@ sourceMappingURL=test_url',
      ].join('\n'));
    });

    it('should get minified source', function() {
      var minified = {
        code: 'minified',
        map: 'map',
      };

      require('uglify-js').minify = function() {
        return minified;
      };

      bundle.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));
      bundle.finalize();
      expect(bundle.getMinifiedSourceAndMap()).toBe(minified);
    });
  });

  describe('sourcemap bundle', function() {
    it('should create sourcemap', function() {
      var p = new Bundle('test_url');
      p.addModule(new ModuleTransport({
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
      }));
      p.addModule(new ModuleTransport({
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
      }));

      p.setMainModuleId('foo');
      p.finalize({runMainModule: true});
      var s = p.getSourceMap();
      expect(s).toEqual(genSourceMap(p.getModules()));
    });

    it('should combine sourcemaps', function() {
      var p = new Bundle('test_url');

      p.addModule(new ModuleTransport({
        code: 'transformed foo;\n',
        map: {name: 'sourcemap foo'},
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));

      p.addModule(new ModuleTransport({
        code: 'transformed foo;\n',
        map: {name: 'sourcemap bar'},
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));

      p.addModule(new ModuleTransport({
        code: 'image module;\nimage module;',
        virtual: true,
        sourceCode: 'image module;\nimage module;',
        sourcePath: 'image.png',
      }));

      p.setMainModuleId('foo');
      p.finalize({runMainModule: true});

      var s = p.getSourceMap();
      expect(s).toEqual({
        file: 'bundle.js',
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
              names: {},
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
              file: 'RunMainModule.js',
              mappings: 'AAAA;',
              names: {},
              sources: [ 'RunMainModule.js' ],
              sourcesContent: [';require("foo");'],
              version: 3,
            }
          }
        ],
      });
    });
  });

  describe('getAssets()', function() {
    it('should save and return asset objects', function() {
      var p = new Bundle('test_url');
      var asset1 = {};
      var asset2 = {};
      p.addAsset(asset1);
      p.addAsset(asset2);
      p.finalize();
      expect(p.getAssets()).toEqual([asset1, asset2]);
    });
  });

  describe('getJSModulePaths()', function() {
    it('should return module paths', function() {
      var p = new Bundle('test_url');
      p.addModule(new ModuleTransport({
        code: 'transformed foo;\n',
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));
      p.addModule(new ModuleTransport({
        code: 'image module;\nimage module;',
        virtual: true,
        sourceCode: 'image module;\nimage module;',
        sourcePath: 'image.png',
      }));

      expect(p.getJSModulePaths()).toEqual(['foo path']);
    });
  });
});


 function genSourceMap(modules) {
   var sourceMapGen = new SourceMapGenerator({file: 'bundle.js', version: 3});
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
