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

describe('Package', function() {
  var ModuleTransport;
  var Package;
  var ppackage;

  beforeEach(function() {
    Package = require('../Package');
    ModuleTransport = require('../../lib/ModuleTransport');
    ppackage = new Package('test_url');
    ppackage.getSourceMap = jest.genMockFn().mockImpl(function() {
      return 'test-source-map';
    });
  });

  describe('source package', function() {
    it('should create a package and get the source', function() {
      ppackage.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path',
      }));
      ppackage.addModule(new ModuleTransport({
        code: 'transformed bar;',
        sourceCode: 'source bar',
        sourcePath: 'bar path',
      }));

      ppackage.finalize({});
      expect(ppackage.getSource()).toBe([
        'transformed foo;',
        'transformed bar;',
        '\/\/@ sourceMappingURL=test_url'
      ].join('\n'));
    });

    it('should be ok to leave out the source map url', function() {
      var p = new Package();
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

    it('should create a package and add run module code', function() {
      ppackage.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));

      ppackage.addModule(new ModuleTransport({
        code: 'transformed bar;',
        sourceCode: 'source bar',
        sourcePath: 'bar path'
      }));

      ppackage.setMainModuleId('foo');
      ppackage.finalize({runMainModule: true});
      expect(ppackage.getSource()).toBe([
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

      ppackage.addModule(new ModuleTransport({
        code: 'transformed foo;',
        sourceCode: 'source foo',
        sourcePath: 'foo path'
      }));
      ppackage.finalize();
      expect(ppackage.getMinifiedSourceAndMap()).toBe(minified);
    });
  });

  describe('sourcemap package', function() {
    it('should create sourcemap', function() {
      var p = new Package('test_url');
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
      expect(s).toEqual(genSourceMap(p._modules));
    });

    it('should combine sourcemaps', function() {
      var p = new Package('test_url');

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
      var p = new Package('test_url');
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
      var p = new Package('test_url');
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
   var packageLineNo = 0;
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
           generated: {line: packageLineNo + 1, column: 0},
           original: {line: transformedLineCount + 1, column: 0},
           source: sourcePath
         });
       }
       lastCharNewLine = transformedCode[t] === '\n';
       if (lastCharNewLine) {
         transformedLineCount++;
         packageLineNo++;
       }
     }
     packageLineNo++;
     sourceMapGen.setSourceContent(
       sourcePath,
       sourceCode
     );
   }
   return sourceMapGen.toJSON();
 }
