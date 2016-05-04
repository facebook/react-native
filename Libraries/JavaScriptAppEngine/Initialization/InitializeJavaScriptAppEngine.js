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
  global.GLOBAL = this;
}

if (typeof window === 'undefined') {
  global.window = GLOBAL;
}

function setUpConsole() {
  // ExceptionsManager transitively requires Promise so we install it after
  var ExceptionsManager = require('ExceptionsManager');
  ExceptionsManager.installConsoleErrorReporter();
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
function polyfillGlobal(name, newValue, scope = GLOBAL) {
  var descriptor = Object.getOwnPropertyDescriptor(scope, name) || {
    // jest for some bad reasons runs the polyfill code multiple times. In jest
    // environment, XmlHttpRequest doesn't exist so getOwnPropertyDescriptor
    // returns undefined and defineProperty default for writable is false.
    // Therefore, the second time it runs, defineProperty will fatal :(
    writable: true,
  };

  if (scope[name] !== undefined) {
    var backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(scope, backupName, {...descriptor, value: scope[name]});
  }

  Object.defineProperty(scope, name, {...descriptor, value: newValue});
}

/**
 * Polyfill a module if it is not already defined in `scope`.
 */
function polyfillIfNeeded(name, polyfill, scope = GLOBAL, descriptor = {}) {
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

  var ErrorUtils = require('ErrorUtils');
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
  var JSTimers = require('JSTimers');
  GLOBAL.setTimeout = JSTimers.setTimeout;
  GLOBAL.setInterval = JSTimers.setInterval;
  GLOBAL.setImmediate = JSTimers.setImmediate;
  GLOBAL.clearTimeout = JSTimers.clearTimeout;
  GLOBAL.clearInterval = JSTimers.clearInterval;
  GLOBAL.clearImmediate = JSTimers.clearImmediate;
  GLOBAL.cancelAnimationFrame = JSTimers.clearInterval;
  GLOBAL.requestAnimationFrame = function(cb) {
    /*requestAnimationFrame() { [native code] };*/  // Trick scroller library
    return JSTimers.requestAnimationFrame(cb);      // into thinking it's native
  };
}

function setUpAlert() {
  if (!GLOBAL.alert) {
    GLOBAL.alert = function(text) {
      // Require Alert on demand. Requiring it too early can lead to issues
      // with things like Platform not being fully initialized.
      require('Alert').alert('Alert', '' + text);
    };
  }
}

function setUpPromise() {
  // The native Promise implementation throws the following error:
  // ERROR: Event loop not supported.
  GLOBAL.Promise = require('Promise');
}

function setUpXHR() {
  // The native XMLHttpRequest in Chrome dev tools is CORS aware and won't
  // let you fetch anything from the internet
  polyfillGlobal('XMLHttpRequest', require('XMLHttpRequest'));
  polyfillGlobal('FormData', require('FormData'));

  var fetchPolyfill = require('fetch');
  polyfillGlobal('fetch', fetchPolyfill.fetch);
  polyfillGlobal('Headers', fetchPolyfill.Headers);
  polyfillGlobal('Request', fetchPolyfill.Request);
  polyfillGlobal('Response', fetchPolyfill.Response);
}

function setUpGeolocation() {
  polyfillIfNeeded('navigator', {}, GLOBAL, {
    writable: true,
    enumerable: true,
    configurable: true,
  });
  polyfillGlobal('geolocation', require('Geolocation'), GLOBAL.navigator);
}

function setUpMapAndSet() {
  polyfillGlobal('Map', require('Map'));
  polyfillGlobal('Set', require('Set'));
}

function setUpProduct() {
  Object.defineProperty(GLOBAL.navigator, 'product', {value: 'ReactNative'});
}

function setUpWebSockets() {
  polyfillGlobal('WebSocket', require('WebSocket'));
}

function setUpProfile() {
  if (__DEV__) {
    var Systrace = require('Systrace');
    Systrace.swizzleReactPerf();
  }
}

function setUpProcessEnv() {
  GLOBAL.process = GLOBAL.process || {};
  GLOBAL.process.env = GLOBAL.process.env || {};
  if (!GLOBAL.process.env.NODE_ENV) {
    GLOBAL.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
  }
}

function setUpNumber() {
  polyfillIfNeeded('EPSILON', Math.pow(2, -52), Number);
  polyfillIfNeeded('MAX_SAFE_INTEGER', Math.pow(2, 53) - 1, Number);
  polyfillIfNeeded('MIN_SAFE_INTEGER', -(Math.pow(2, 53) - 1), Number);
}

function setUpDevTools() {
  // not when debugging in chrome
  if (__DEV__) { // TODO(9123099) Strip `__DEV__ &&`
    if (!window.document && require('Platform').OS === 'ios') {
      var setupDevtools = require('setupDevtools');
      setupDevtools();
    }
  }
}

setUpProcessEnv();
setUpConsole();
setUpTimers();
setUpAlert();
setUpPromise();
setUpErrorHandler();
setUpXHR();
setUpGeolocation();
setUpMapAndSet();
setUpProduct();
setUpWebSockets();
setUpProfile();
setUpNumber();
setUpDevTools();

// Just to make sure the JS gets packaged up. Wait until the JS environment has
// been initialized before requiring them.
if (__DEV__) {
  require('RCTDebugComponentOwnership');
}
require('RCTDeviceEventEmitter');
require('RCTNativeAppEventEmitter');
require('PerformanceLogger');

if (__DEV__) {
  // include this transform and it's dependencies on the bundle on dev mode
  require('react-transform-hmr');
}
