/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .setMock('worker-farm', function() { return function() {};})
  .dontMock('path')
  .dontMock('q')
  .dontMock('os')
  .dontMock('underscore')
  .setMock('uglify-js')
  .dontMock('../');

var q = require('q');

describe('Packager', function() {
  var getDependencies;
  var wrapModule;
  var Packager;

  beforeEach(function() {
    getDependencies = jest.genMockFn();
    wrapModule = jest.genMockFn();
    require('../../DependencyResolver').mockImpl(function() {
      return {
        getDependencies: getDependencies,
        wrapModule: wrapModule,
      };
    });

    Packager = require('../');
  });

  pit('create a package', function() {
    require('fs').statSync.mockImpl(function() {
      return {
        isDirectory: function() {return true;}
      };
    });

    var packager = new Packager({projectRoots: []});
    var modules = [
      {id: 'foo', path: '/root/foo.js', dependencies: []},
      {id: 'bar', path: '/root/bar.js', dependencies: []},
      { id: 'image!img',
        path: '/root/img/img.png',
        isAsset: true,
        dependencies: [],
      }
    ];

    getDependencies.mockImpl(function() {
      return q({
        mainModuleId: 'foo',
        dependencies: modules
      });
    });

    require('../../JSTransformer').prototype.loadFileAndTransform
      .mockImpl(function(path) {
        return q({
          code: 'transformed ' + path,
          sourceCode: 'source ' + path,
          sourcePath: path
        });
      });

    wrapModule.mockImpl(function(module, code) {
      return 'lol ' + code + ' lol';
    });

    return packager.package('/root/foo.js', true, 'source_map_url')
      .then(function(p) {
        expect(p.addModule.mock.calls[0]).toEqual([
          'lol transformed /root/foo.js lol',
          'source /root/foo.js',
          '/root/foo.js'
        ]);
        expect(p.addModule.mock.calls[1]).toEqual([
          'lol transformed /root/bar.js lol',
          'source /root/bar.js',
          '/root/bar.js'
        ]);
        expect(p.addModule.mock.calls[2]).toEqual([
          'lol module.exports = ' +
            JSON.stringify({ uri: 'img', isStatic: true}) +
            '; lol',
          'module.exports = ' +
            JSON.stringify({ uri: 'img', isStatic: true}) +
            ';',
          '/root/img/img.png'
        ]);

        expect(p.finalize.mock.calls[0]).toEqual([
          {runMainModule: true}
        ]);
      });
  });

});
