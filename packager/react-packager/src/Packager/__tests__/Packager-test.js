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
  .dontMock('os')
  .dontMock('underscore')
  .setMock('uglify-js')
  .dontMock('../');

var Promise = require('bluebird');

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

    var packager = new Packager({projectRoots: ['/root']});
    var modules = [
      {id: 'foo', path: '/root/foo.js', dependencies: []},
      {id: 'bar', path: '/root/bar.js', dependencies: []},
      {
        id: 'image!img',
        path: '/root/img/img.png',
        isAsset_DEPRECATED: true,
        dependencies: [],
      },
      {
        id: 'new_image.png',
        path: '/root/img/new_image.png',
        isAsset: true,
        resolution: 2,
        dependencies: []
      }
    ];

    getDependencies.mockImpl(function() {
      return Promise.resolve({
        mainModuleId: 'foo',
        dependencies: modules
      });
    });

    require('../../JSTransformer').prototype.loadFileAndTransform
      .mockImpl(function(path) {
        return Promise.resolve({
          code: 'transformed ' + path,
          sourceCode: 'source ' + path,
          sourcePath: path
        });
      });

    wrapModule.mockImpl(function(module, code) {
      return 'lol ' + code + ' lol';
    });

    require('image-size').mockImpl(function(path, cb) {
      cb(null, { width: 50, height: 100 });
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

        var imgModule = {
          isStatic: true,
          path: '/root/img/new_image.png',
          uri: 'assets/img/new_image.png',
          width: 25,
          height: 50,
        };

        expect(p.addModule.mock.calls[3]).toEqual([
          'lol module.exports = ' +
            JSON.stringify(imgModule) +
            '; lol',
          'module.exports = ' +
            JSON.stringify(imgModule) +
            ';',
          '/root/img/new_image.png'
        ]);

        expect(p.finalize.mock.calls[0]).toEqual([
          {runMainModule: true}
        ]);
      });
  });

});
