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

	if (scope[name] !== undefined && Object.isExtensible(scope)) {
		var backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
		Object.defineProperty(scope, backupName, descriptor);
	}

	// If working on an existing accessor, we need to set the new value as an accessor
	// instead of as a value. This prevents the exception: "Invalid property. 'value'
	// present on property with getter or setter."
	// https://github.com/facebook/react-native/pull/4287
	var newDescriptor;
	if (descriptor.get) {
		newDescriptor = {...descriptor, get: function() { return newValue; }};
	} else {
		newDescriptor = {...descriptor, value: newValue};
	}

	// If an existing property is marked as non-configurable or the object
	// is frozen, we can't polyfill it and will have to assume the native
	// implementation is good enough.
	try {
		Object.defineProperty(scope, name, newDescriptor);
	} catch (e) {
		console.warn(`Unable to polyfill ${name}: ${e.message}`);
	}
}

module.exports = polyfillGlobal;
