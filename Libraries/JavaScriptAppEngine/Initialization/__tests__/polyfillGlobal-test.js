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

var polyfillGlobal = require('polyfillGlobal');

describe('polyfillGlobal', function() {

	it('supports polyfilling vanilla properties', function() {
		var scope = {
			obj: {
				method: function() {
					return 'a';
				}
			}
		};

		var polyfill = {
			method: function() {
				return 'b';
			}
		};

		polyfillGlobal('obj', polyfill, scope);
		expect(scope.obj.method()).toEqual('b');
		expect(scope.originalObj.method()).toEqual('a');
	});

	it('supports polyfilling data properties', function() {
		var scope = {};
		Object.defineProperty(scope, 'obj', {
			configurable: true,
			writable: true,
			value: {
				method: function() {
					return 'a';
				}
			}
		});

		var polyfill = {
			method: function() {
				return 'b';
			}
		};

		polyfillGlobal('obj', polyfill, scope);
		expect(scope.obj.method()).toEqual('b');
		expect(scope.originalObj.method()).toEqual('a');
	});

	it('supports polyfilling accessors', function() {
		var scope = {};
		Object.defineProperty(scope, 'obj', {
			configurable: true,
			get: function() {
				return {
					method: function() {
						return 'a';
					}
				};
			}
		});

		var polyfill = {
			method: function() {
				return 'b';
			}
		};

		polyfillGlobal('obj', polyfill, scope);
		expect(scope.obj.method()).toEqual('b');
		expect(scope.originalObj.method()).toEqual('a');
	});

	it('should not throw when polyfilling nonconfigurable properties', function() {
		var scope = {};
		Object.defineProperty(scope, 'obj', {
			configurable: false,
			get: function() {
				return {
					method: function() {
						return 'a';
					}
				};
			}
		});

		var polyfill = {
			method: function() {
				return 'b';
			}
		};

		polyfillGlobal('obj', polyfill, scope);
		expect(scope.obj.method()).toEqual('a');
	});

});
