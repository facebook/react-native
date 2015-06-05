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
  .dontMock('absolute-path')
  .dontMock('../ModuleDescriptor');


describe('ModuleDescriptor', function() {
  var ModuleDescriptor;
  var Promise;

  beforeEach(function() {
    ModuleDescriptor = require('../ModuleDescriptor');
    Promise = require('bluebird');
  });

  describe('constructor', function() {
    it('should validate fields', function() {
      /* eslint no-new:0*/
      expect(function() {
        new ModuleDescriptor({});
      }).toThrow();

      expect(function() {
        new ModuleDescriptor({
          id: 'foo',
        });
      }).toThrow();

      expect(function() {
        new ModuleDescriptor({
          id: 'foo',
          path: 'foo',
        });
      }).toThrow();

      expect(function() {
        new ModuleDescriptor({
          id: 'foo',
          path: '/foo',
          isAsset: true,
        });
      }).toThrow();

      var m = new ModuleDescriptor({
        id: 'foo',
        path: '/foo',
        isAsset: true,
        resolution: 1,
      });

      expect(m.toJSON()).toEqual({
        altId:undefined,
        dependencies: undefined,
        isAsset_DEPRECATED: false,
        isJSON: undefined,
        isPolyfill: false,
        id: 'foo',
        path: '/foo',
        isAsset: true,
        resolution: 1,
      });
    });
  });

  describe('loadDependencies', function() {
    pit('should load dependencies', function() {
      var mod = new ModuleDescriptor({
        id: 'foo',
        path: '/foo',
        isAsset: true,
        resolution: 1,
      });

      return mod.loadDependencies(function() {
        return Promise.resolve([1, 2]);
      }).then(function() {
        expect(mod.dependencies).toEqual([1, 2]);
      });
    });

    pit('should load cached dependencies', function() {
      var mod = new ModuleDescriptor({
        id: 'foo',
        path: '/foo',
        isAsset: true,
        resolution: 1,
      });

      return mod.loadDependencies(function() {
        return Promise.resolve([1, 2]);
      }).then(function() {
        return mod.loadDependencies(function() {
          throw new Error('no!');
        });
      }).then(function() {
        expect(mod.dependencies).toEqual([1, 2]);
      });
    });
  });
});
