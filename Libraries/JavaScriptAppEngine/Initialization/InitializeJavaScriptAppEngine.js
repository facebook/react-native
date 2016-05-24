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
 */

/* eslint strict: 0 */
/* globals GLOBAL: true, window: true */

require('regenerator-runtime/runtime');

if (typeof GLOBAL === 'undefined') {
  global.GLOBAL = global;
}

if (typeof window === 'undefined') {
  global.window = global;
}

function setUpProcess() {
  GLOBAL.process = GLOBAL.process || {};
  GLOBAL.process.env = GLOBAL.process.env || {};
  if (!GLOBAL.process.env.NODE_ENV) {
    GLOBAL.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
  }
}

function setUpProfile() {
  const Systrace = require('Systrace');
  Systrace.setEnabled(global.__RCTProfileIsProfiling || false);
}

function setUpConsole() {
  // ExceptionsManager transitively requires Promise so we install it after
  const ExceptionsManager = require('ExceptionsManager');
  ExceptionsManager.installConsoleErrorReporter();

  require('RCTLog');
}

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
function polyfillGlobal(name, newValue, scope = global) {
  const descriptor = Object.getOwnPropertyDescriptor(scope, name);
  if (descriptor) {
    const backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(scope, backupName, {...descriptor, value: scope[name]});
  }

  const {enumerable, writable} = descriptor || {};

  // jest for some bad reasons runs the polyfill code multiple times. In jest
  // environment, XmlHttpRequest doesn't exist so getOwnPropertyDescriptor
  // returns undefined and defineProperty default for writable is false.
  // Therefore, the second time it runs, defineProperty will fatal :(

  Object.defineProperty(scope, name, {
    configurable: true,
    enumerable: enumerable !== false,
    writable: writable !== false,
    value: newValue,
  });
}

function polyfillLazyGlobal(name, valueFn, scope = global) {
  const descriptor = getPropertyDescriptor(scope, name);
  if (descriptor) {
    const backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(scope, backupName, descriptor);
  }

  const {enumerable, writable} = descriptor || {};
  Object.defineProperty(scope, name, {
    configurable: true,
    enumerable: enumerable !== false,
    get() {
      return (this[name] = valueFn());
    },
    set(value) {
      Object.defineProperty(this, name, {
        configurable: true,
        enumerable: enumerable !== false,
        writable: writable !== false,
        value,
      });
    }
  });
}

/**
 * Polyfill a module if it is not already defined in `scope`.
 */
function polyfillIfNeeded(name, polyfill, scope = global, descriptor = {}) {
  if (scope[name] === undefined) {
    Object.defineProperty(scope, name, {...descriptor, value: polyfill});
  }
}

function setUpErrorHandler() {
  if (global.__fbDisableExceptionsManager) {
    return;
  }

  function handleError(e, isFatal) {
    try {
      require('ExceptionsManager').handleException(e, isFatal);
    } catch (ee) {
      console.log('Failed to print error: ', ee.message);
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
function setUpTimers() {
  const defineLazyTimer = (name) => {
    polyfillLazyGlobal(name, () => require('JSTimers')[name]);
  };
  defineLazyTimer('setTimeout');
  defineLazyTimer('setInterval');
  defineLazyTimer('setImmediate');
  defineLazyTimer('clearTimeout');
  defineLazyTimer('clearInterval');
  defineLazyTimer('clearImmediate');
  defineLazyTimer('requestAnimationFrame');
  defineLazyTimer('cancelAnimationFrame');
}

function setUpAlert() {
  if (!global.alert) {
    global.alert = function(text) {
      // Require Alert on demand. Requiring it too early can lead to issues
      // with things like Platform not being fully initialized.
      require('Alert').alert('Alert', '' + text);
    };
  }
}

function setUpPromise() {
  // The native Promise implementation throws the following error:
  // ERROR: Event loop not supported.
  polyfillLazyGlobal('Promise', () => require('Promise'));
}

function setUpXHR() {
  // The native XMLHttpRequest in Chrome dev tools is CORS aware and won't
  // let you fetch anything from the internet
  polyfillLazyGlobal('XMLHttpRequest', () => require('XMLHttpRequest'));
  polyfillLazyGlobal('FormData', () => require('FormData'));

  polyfillLazyGlobal('fetch', () => require('fetch').fetch);
  polyfillLazyGlobal('Headers', () => require('fetch').Headers);
  polyfillLazyGlobal('Request', () => require('fetch').Request);
  polyfillLazyGlobal('Response', () => require('fetch').Response);

  polyfillLazyGlobal('WebSocket', () => require('WebSocket'));
}

function setUpGeolocation() {
  polyfillIfNeeded('navigator', {}, global, {
    writable: true,
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(global.navigator, 'product', {value: 'ReactNative'});

  polyfillLazyGlobal('geolocation', () => require('Geolocation'), global.navigator);
}

function setUpMapAndSet() {
  // We can't make these lazy as Map checks the global.Map to see if it's
  // available but in our case it'll be a lazy getter.
  polyfillGlobal('Map', require('Map'));
  polyfillGlobal('Set', require('Set'));
}

function setUpDevTools() {
  if (__DEV__) {
    // not when debugging in chrome
    if (!window.document && require('Platform').OS === 'ios') {
      const setupDevtools = require('setupDevtools');
      setupDevtools();
    }

    require('RCTDebugComponentOwnership');
    require('react-transform-hmr');
  }
}

function getPropertyDescriptor(object, name) {
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
setUpMapAndSet();
setUpDevTools();

// Just to make sure the JS gets packaged up. Wait until the JS environment has
// been initialized before requiring them.
require('RCTDeviceEventEmitter');
require('RCTNativeAppEventEmitter');
require('PerformanceLogger');
