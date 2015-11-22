/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule polyfillGlobal
 */

'use strict';

var GLOBAL = require('GLOBAL');

/**
 * Assigns a new global property, replacing the existing one if there is one.
 *
 * Existing properties are preserved as `originalPropertyName`. Both properties
 * will maintain the same enumerability & configurability.
 *
 * This allows you to undo the more aggressive polyfills, should you need to.
 * For example, if you want to route network requests through DevTools (to trace
 * them):
 *
 *     global.XMLHttpRequest = global.originalXMLHttpRequest;
 *
 * For more info on that particular case, see:
 * https://github.com/facebook/react-native/issues/934
 */
function polyfillGlobal(name, newValue, scope=GLOBAL) {
	var descriptor = Object.getOwnPropertyDescriptor(scope, name) || {
		// jest for some bad reasons runs the polyfill code multiple times. In jest
		// environment, XmlHttpRequest doesn't exist so getOwnPropertyDescriptor
		// returns undefined and defineProperty default for writable is false.
		// Therefore, the second time it runs, defineProperty will fatal :(
		writable: true,
	};

	// Properties cannot have both a getter and value. The guards against the exception:
	// "Invalid property. 'value' present on property with getter or setter."
	delete descriptor.get;
	delete descriptor.set;

	if (scope[name] !== undefined) {
		var backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
		Object.defineProperty(scope, backupName, {...descriptor, value: scope[name]});
	}

	Object.defineProperty(scope, name, {...descriptor, value: newValue});
}

module.exports = polyfillGlobal;
