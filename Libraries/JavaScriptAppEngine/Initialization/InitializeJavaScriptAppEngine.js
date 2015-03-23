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

/* eslint global-strict: 0 */
/* globals GLOBAL: true, window: true */

// Just to make sure the JS gets packaged up.
require('RCTDeviceEventEmitter');

if (typeof GLOBAL === 'undefined') {
  GLOBAL = this;
}

if (typeof window === 'undefined') {
  window = GLOBAL;
}

/**
 * The document must be shimmed before anything else that might define the
 * `ExecutionEnvironment` module (which checks for `document.createElement`).
 */
function setupDocumentShim() {
  // The browser defines Text and Image globals by default. If you forget to
  // require them, then the error message is very confusing.
  function getInvalidGlobalUseError(name) {
    return new Error(
      'You are trying to render the global ' + name + ' variable as a ' +
      'React element. You probably forgot to require ' + name + '.'
    );
  }
  GLOBAL.Text = {
    get defaultProps() {
      throw getInvalidGlobalUseError('Text');
    }
  };
  GLOBAL.Image = {
    get defaultProps() {
      throw getInvalidGlobalUseError('Image');
    }
  };
  // Force `ExecutionEnvironment.canUseDOM` to be false.
  if (GLOBAL.document) {
    GLOBAL.document.createElement = null;
  }
}

function handleErrorWithRedBox(e) {
  try {
    require('ExceptionsManager').handleException(e);
  } catch(ee) {
    console.log('Failed to print error: ', ee.message);
  }
}

function setupRedBoxErrorHandler() {
  var ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleErrorWithRedBox);
}

/**
 * Sets up a set of window environment wrappers that ensure that the
 * BatchedBridge is flushed after each tick. In both the case of the
 * `UIWebView` based `RCTJavaScriptCaller` and `RCTContextCaller`, we
 * implement our own custom timing bridge that should be immune to
 * unexplainably dropped timing signals.
 */
function setupTimers() {
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

function setupAlert() {
  var RCTAlertManager = require('NativeModules').AlertManager;
  if (!GLOBAL.alert) {
    GLOBAL.alert = function(text) {
      var alertOpts = {
        title: 'Alert',
        message: '' + text,
        buttons: [{'cancel': 'Okay'}],
      };
      RCTAlertManager.alertWithArgs(alertOpts, null);
    };
  }
}

function setupPromise() {
  // The native Promise implementation throws the following error:
  // ERROR: Event loop not supported.
  GLOBAL.Promise = require('Promise');
}

function setupXHR() {
  // The native XMLHttpRequest in Chrome dev tools is CORS aware and won't
  // let you fetch anything from the internet
  GLOBAL.XMLHttpRequest = require('XMLHttpRequest');
  GLOBAL.fetch = require('fetch');
}

function setupGeolocation() {
  GLOBAL.navigator = GLOBAL.navigator || {};
  GLOBAL.navigator.geolocation = require('Geolocation');
}

setupDocumentShim();
setupRedBoxErrorHandler();
setupTimers();
setupAlert();
setupPromise();
setupXHR();
setupGeolocation();
