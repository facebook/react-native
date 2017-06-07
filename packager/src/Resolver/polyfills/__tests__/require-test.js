/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// TODO: figure out why jest.resetModules() doesn't reset the polyfill's module cache
const origGlobalRequire = global.require;
require('../require');
const requireShim = global.require;
const defineShim = global.__d;
global.require = origGlobalRequire;

describe('require', () => {
  describe('exports', () => {
    it('should be an object containing named exports', () => {
      defineShim(function(global, require, module, exports) {
        expect(exports).toEqual({});
        exports.hello = 'world';
      },1);
      expect(requireShim(1)).toEqual({hello: 'world'});
    });
  });

  describe('this', () => {
    it('should be the exports object', () => {
      defineShim(function(global, require, module, exports) {
        expect(this).toBe(exports);
      },2);
      requireShim(2);
    });
  });

  describe('module.id', () => {
    it('should be the identifier of the module passed to require', () => {
      defineShim(function(global, require, module, exports) {
        expect(module.id).toBe(3);
      },3);
      requireShim(3);
    });
  });

  describe('module.exports', () => {
    it('should be the same as exports', () => {
      defineShim(function(global, require, module, exports) {
        expect(module.exports).toBe(exports);
      },11);
      requireShim(11);
    });

    describe('should support re-assignements', () => {
      let moduleId = 21;
      function testModuleExportsValue(value) {
        defineShim(function(global, require, module, exports) {
          module.exports = value;
        },moduleId);
        expect(requireShim(moduleId)).toBe(value);
        moduleId++;
      }

      it('to a primitive value', () => {
        testModuleExportsValue(123);
      });

      it('to an object', () => {
        testModuleExportsValue({
          hello: 'world'
        });
      });

      it('to a function', () => {
        testModuleExportsValue(function Test() {});
      });
    });
  });

  describe('dependencies', () => {
    it('should be resolved', () => {
      defineShim(function(global, require, module, exports) {
        exports.dep2 = require(32);
      },31);
      defineShim(function(global, require, module, exports) {
        exports.hello = 'world';
      },32);
      expect(requireShim(31)).toEqual({
        dep2: {
          hello: 'world'
        }
      });
    });

    it('should handle circular deps using exports', () => {
      defineShim(function(global, require, module, exports) {
        exports.first = 'first value';
        var p = require(42).p;
        exports.first = 'second value';
        exports.firstWas = p();
      },41);
      defineShim(function(global, require, module, exports) {
        var first = require(41).first;
        exports.p = function() {
          return first;
        }
      },42);
      expect(requireShim(41)).toEqual({
        first: 'second value',
        firstWas: 'first value'
      });
    });

    it('should handle circular deps using module.exports', () => {
      defineShim(function(global, require, module, exports) {
        module.exports = {
          first: 'first value'
        };
        var p = require(52).p;
        module.exports.first = 'second value';
        module.exports.firstWas = p();
      },51);
      defineShim(function(global, require, module, exports) {
        var first = require(51).first;
        exports.p = function() {
          return first;
        }
      },52);
      expect(requireShim(51)).toEqual({
        first: 'second value',
        firstWas: 'first value'
      });
    });
  });
});
