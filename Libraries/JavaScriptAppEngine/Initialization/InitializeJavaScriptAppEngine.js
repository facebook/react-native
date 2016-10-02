/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Sets up global variables typical in most JavaScript environments.
 *
 * 1. Global timers (via `setTimeout` etc).
 * 2. Global console object.
 * 3. Hooks for printing stack traces with source maps.
 *
 * Leaves enough room in the environment for implementing your own:
 * 1. Require system.
 * 2. Bridged modules.
 *
 * @providesModule InitializeJavaScriptAppEngine
 * @flow
 */

/* eslint strict: 0 */
/* globals window: true */

require('regenerator-runtime/runtime');

if (global.GLOBAL === undefined) {
  global.GLOBAL = global;
}

if (global.window === undefined) {
  global.window = global;
}

function setUpProcess(): void {
  global.process = global.process || {};
  global.process.env = global.process.env || {};
  if (!global.process.env.NODE_ENV) {
    global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
  }
}

function setUpProfile(): void {
  const Systrace = require('Systrace');
  Systrace.setEnabled(global.__RCTProfileIsProfiling || false);
}

function setUpConsole(): void {
  // ExceptionsManager transitively requires Promise so we install it after
  const ExceptionsManager = require('ExceptionsManager');
  ExceptionsManager.installConsoleErrorReporter();

  require('RCTLog');
}

/**
 * Sets an object's property. If a property with the same name exists, this will
 * replace it but maintain its descriptor configuration.
 *
 * The original property value will be preserved as `original[PropertyName]` so
 * that, if necessary, it can be restored. For example, if you want to route
 * network requests through DevTools (to trace them):
 *
 *   global.XMLHttpRequest = global.originalXMLHttpRequest;
 *
 * @see https://github.com/facebook/react-native/issues/934
 */
function defineProperty(object: Object, name: string, newValue: mixed): void {
  const descriptor = Object.getOwnPropertyDescriptor(object, name);
  if (descriptor) {
    const backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(object, backupName, {
      ...descriptor,
      value: object[name],
    });
  }

  const {enumerable, writable, configurable} = descriptor || {};
  if (!descriptor || configurable) {
    Object.defineProperty(object, name, {
      configurable: true,
      enumerable: enumerable !== false,
      writable: writable !== false,
      value: newValue,
    });
  }
}

function defineLazyProperty<T>(
  object: Object,
  name: string,
  getNewValue: () => T
): void {
  const defineLazyObjectProperty = require('defineLazyObjectProperty');

  const descriptor = getPropertyDescriptor(object, name);
  if (descriptor) {
    const backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(object, backupName, descriptor);
  }

  const {configurable} = descriptor || {};
  if (!descriptor || configurable) {
    defineLazyObjectProperty(object, name, {
      get: getNewValue,
      enumerable: descriptor ? descriptor.enumerable !== false : true,
      writable: descriptor ? descriptor.writable !== false : true,
    });
  }
}

function setUpErrorHandler(): void {
  if (global.__fbDisableExceptionsManager) {
    return;
  }

  function handleError(e, isFatal) {
    try {
      require('ExceptionsManager').handleException(e, isFatal);
    } catch (ee) {
      /* eslint-disable no-console-disallow */
      console.log('Failed to print error: ', ee.message);
      /* eslint-enable no-console-disallow */
      throw e;
    }
  }

  const ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleError);
}

/**
 * Sets up a set of window environment wrappers that ensure that the
 * BatchedBridge is flushed after each tick. In both the case of the
 * `UIWebView` based `RCTJavaScriptCaller` and `RCTContextCaller`, we
 * implement our own custom timing bridge that should be immune to
 * unexplainably dropped timing signals.
 */
function setUpTimers(): void {
  const defineLazyTimer = name => {
    defineLazyProperty(global, name, () => require('JSTimers')[name]);
  };
  defineLazyTimer('setTimeout');
  defineLazyTimer('setInterval');
  defineLazyTimer('setImmediate');
  defineLazyTimer('clearTimeout');
  defineLazyTimer('clearInterval');
  defineLazyTimer('clearImmediate');
  defineLazyTimer('requestAnimationFrame');
  defineLazyTimer('cancelAnimationFrame');
  defineLazyTimer('requestIdleCallback');
  defineLazyTimer('cancelIdleCallback');
}

function setUpAlert(): void {
  if (!global.alert) {
    global.alert = function(text) {
      // Require Alert on demand. Requiring it too early can lead to issues
      // with things like Platform not being fully initialized.
      require('Alert').alert('Alert', '' + text);
    };
  }
}

function setUpPromise(): void {
  // The native Promise implementation throws the following error:
  // ERROR: Event loop not supported.
  defineLazyProperty(global, 'Promise', () => require('Promise'));
}

function setUpXHR(): void {
  // The native XMLHttpRequest in Chrome dev tools is CORS aware and won't
  // let you fetch anything from the internet
  defineLazyProperty(global, 'XMLHttpRequest', () => require('XMLHttpRequest'));
  defineLazyProperty(global, 'FormData', () => require('FormData'));

  defineLazyProperty(global, 'fetch', () => require('fetch').fetch);
  defineLazyProperty(global, 'Headers', () => require('fetch').Headers);
  defineLazyProperty(global, 'Request', () => require('fetch').Request);
  defineLazyProperty(global, 'Response', () => require('fetch').Response);

  defineLazyProperty(global, 'WebSocket', () => require('WebSocket'));
}

function setUpGeolocation(): void {
  if (global.navigator === undefined) {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {},
    });
  }
  const {navigator} = global;
  Object.defineProperty(navigator, 'product', {value: 'ReactNative'});
  defineLazyProperty(navigator, 'geolocation', () => require('Geolocation'));
}

function setUpCollections(): void {
  // We can't make these lazy because `Map` checks for `global.Map` (which would
  // not exist if it were lazily defined).
  defineProperty(global, 'Map', require('Map'));
  defineProperty(global, 'Set', require('Set'));
}

function setUpDevTools(): void {
  if (__DEV__) {
    // not when debugging in chrome
    // TODO(t12832058) This check is broken
    if (!window.document) {
      const setupDevtools = require('setupDevtools');
      setupDevtools();
    }

    require('RCTDebugComponentOwnership');
    require('react-transform-hmr');
  }
}

function getPropertyDescriptor(object: Object, name: string): any {
  while (object) {
    const descriptor = Object.getOwnPropertyDescriptor(object, name);
    if (descriptor) {
      return descriptor;
    }
    object = Object.getPrototypeOf(object);
  }
}

setUpProcess();
setUpProfile();
setUpConsole();
setUpTimers();
setUpAlert();
setUpPromise();
setUpErrorHandler();
setUpXHR();
setUpGeolocation();
setUpCollections();
setUpDevTools();

// Just to make sure the JS gets packaged up. Wait until the JS environment has
// been initialized before requiring them.
require('RCTDeviceEventEmitter');
require('RCTNativeAppEventEmitter');
require('PerformanceLogger');
