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

// Just to make sure the JS gets packaged up.
require('RCTDebugComponentOwnership');
require('RCTDeviceEventEmitter');
require('PerformanceLogger');
require('regenerator/runtime');

if (typeof GLOBAL === 'undefined') {
  GLOBAL = this;
}

if (typeof window === 'undefined') {
  window = GLOBAL;
}

function handleError(e, isFatal) {
  try {
    require('ExceptionsManager').handleException(e, isFatal);
  } catch(ee) {
    console.log('Failed to print error: ', ee.message);
  }
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
 *     GLOBAL.XMLHTTPRequest = GLOBAL.originalXMLHTTPRequest;
 * 
 * For more info on that particular case, see:
 * https://github.com/facebook/react-native/issues/934
 */
function polyfillGlobal(name, newValue, scope=GLOBAL) {
  var descriptor = Object.getOwnPropertyDescriptor(scope, name);

  if (scope[name] !== undefined) {
    var backupName = `original${name[0].toUpperCase()}${name.substr(1)}`;
    Object.defineProperty(scope, backupName, {...descriptor, value: scope[name]});
  }
  Object.defineProperty(scope, name, {...descriptor, value: newValue});
}

function setUpRedBoxErrorHandler() {
  var ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleError);
}

function setUpRedBoxConsoleErrorHandler() {
  // ExceptionsManager transitively requires Promise so we install it after
  var ExceptionsManager = require('ExceptionsManager');
  var Platform = require('Platform');
  // TODO (#6925182): Enable console.error redbox on Android
  if (__DEV__ && Platform.OS === 'ios') {
    ExceptionsManager.installConsoleErrorReporter();
  }
}

function setUpFlowChecker() {
  if (__DEV__) {
    var checkFlowAtRuntime = require('checkFlowAtRuntime');
    checkFlowAtRuntime();
  }
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
  var RCTAlertManager = require('NativeModules').AlertManager;
  if (!GLOBAL.alert) {
    GLOBAL.alert = function(text) {
      var alertOpts = {
        title: 'Alert',
        message: '' + text,
        buttons: [{'cancel': 'OK'}],
      };
      RCTAlertManager.alertWithArgs(alertOpts, function () {});
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
  GLOBAL.navigator = GLOBAL.navigator || {};
  polyfillGlobal('geolocation', require('Geolocation'), GLOBAL.navigator);
}

function setUpWebSockets() {
  polyfillGlobal('WebSocket', require('WebSocket'));
}

function setUpProfile() {
  console.profile = console.profile || GLOBAL.nativeTraceBeginSection || function () {};
  console.profileEnd = console.profileEnd || GLOBAL.nativeTraceEndSection || function () {};
  if (__DEV__) {
    require('BridgeProfiling').swizzleReactPerf();
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
  Number.EPSILON = Number.EPSILON || Math.pow(2, -52);
  Number.MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
  Number.MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);
}

setUpRedBoxErrorHandler();
setUpTimers();
setUpAlert();
setUpPromise();
setUpXHR();
setUpRedBoxConsoleErrorHandler();
setUpGeolocation();
setUpWebSockets();
setUpProfile();
setUpProcessEnv();
setUpFlowChecker();
setUpNumber();
