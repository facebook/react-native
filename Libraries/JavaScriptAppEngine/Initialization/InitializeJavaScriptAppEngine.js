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

/* globals window: true */

'use strict';

require('regenerator/runtime');

var GLOBAL = require('GLOBAL');
var polyfillGlobal = require('polyfillGlobal');

function setUpConsole() {
  // ExceptionsManager transitively requires Promise so we install it after
  var ExceptionsManager = require('ExceptionsManager');
  ExceptionsManager.installConsoleErrorReporter();
}

function setUpErrorHandler() {
  if (global.__fbDisableExceptionsManager) {
    return;
  }

  function handleError(e, isFatal) {
    try {
      require('ExceptionsManager').handleException(e, isFatal);
    } catch(ee) {
      console.log('Failed to print error: ', ee.message);
    }
  }

  var ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleError);
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

function setUpProduct() {
  Object.defineProperty(GLOBAL.navigator, 'product', {value: 'ReactNative'});
}


function setUpWebSockets() {
  polyfillGlobal('WebSocket', require('WebSocket'));
}

function setUpProfile() {
  if (__DEV__) {
    var BridgeProfiling = require('BridgeProfiling');
    BridgeProfiling.swizzleReactPerf();
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
setUpProduct();
setUpWebSockets();
setUpProfile();
setUpFlowChecker();
setUpNumber();
setUpDevTools();

// Just to make sure the JS gets packaged up. Wait until the JS environment has
// been initialized before requiring them.
if (__DEV__) {
  require('RCTDebugComponentOwnership');
}
require('RCTDeviceEventEmitter');
require('PerformanceLogger');
