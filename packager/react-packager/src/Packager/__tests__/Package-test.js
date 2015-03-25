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
  var Package;
  var ppackage;

  beforeEach(function() {
    Package = require('../Package');
    ppackage = new Package('test_url');
    ppackage.getSourceMap = jest.genMockFn().mockImpl(function() {
      return 'test-source-map';
    });
  });

  describe('source package', function() {
    it('should create a package and get the source', function() {
      ppackage.addModule('transformed foo;', 'source foo', 'foo path');
      ppackage.addModule('transformed bar;', 'source bar', 'bar path');
      ppackage.finalize({});
      expect(ppackage.getSource()).toBe([
        'transformed foo;',
        'transformed bar;',
        '\/\/@ sourceMappingURL=test_url'
      ].join('\n'));
    });

    it('should create a package and add run module code', function() {
      ppackage.addModule('transformed foo;', 'source foo', 'foo path');
      ppackage.addModule('transformed bar;', 'source bar', 'bar path');
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

      ppackage.addModule('transformed foo;', 'source foo', 'foo path');
      ppackage.finalize();
      expect(ppackage.getMinifiedSourceAndMap()).toBe(minified);
    });
  });

  describe('sourcemap package', function() {
    it('should create sourcemap', function() {
      var p = new Package('test_url');
      p.addModule('transformed foo;\n', 'source foo', 'foo path');
      p.addModule('transformed bar;\n', 'source bar', 'bar path');
      p.setMainModuleId('foo');
      p.finalize({runMainModule: true});
      var s = p.getSourceMap();
      expect(s).toEqual(genSourceMap(p._modules));
    });
  });
});

 function genSourceMap(modules) {
   var sourceMapGen = new SourceMapGenerator({file: 'bundle.js', version: 3});
   var packageLineNo = 0;
   for (var i = 0; i < modules.length; i++) {
     var module = modules[i];
     var transformedCode = module.transformedCode;
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
