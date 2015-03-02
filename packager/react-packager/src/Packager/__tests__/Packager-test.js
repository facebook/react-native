'use strict';

jest
  .setMock('worker-farm', function() { return function() {};})
  .dontMock('path')
  .dontMock('q')
  .dontMock('os')
  .dontMock('underscore')
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

        expect(p.finalize.mock.calls[0]).toEqual([
          {runMainModule: true}
        ]);
      });
  });

});
