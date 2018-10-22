/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

/* globals window: true */

/**
 * Sets up global variables typical in most JavaScript environments.
 *
 *   1. Global timers (via `setTimeout` etc).
 *   2. Global console object.
 *   3. Hooks for printing stack traces with source maps.
 *
 * Leaves enough room in the environment for implementing your own:
 *
 *   1. Require system.
 *   2. Bridged modules.
 *
 */
'use strict';

const {polyfillObjectProperty, polyfillGlobal} = require('PolyfillFunctions');

if (global.GLOBAL === undefined) {
  global.GLOBAL = global;
}

if (global.window === undefined) {
  global.window = global;
}

// Set up collections
const _shouldPolyfillCollection = require('_shouldPolyfillES6Collection');
if (_shouldPolyfillCollection('Map')) {
  polyfillGlobal('Map', () => require('Map'));
}
if (_shouldPolyfillCollection('Set')) {
  polyfillGlobal('Set', () => require('Set'));
}

// Set up process
global.process = global.process || {};
global.process.env = global.process.env || {};
if (!global.process.env.NODE_ENV) {
  global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
}

// Setup the Systrace profiling hooks if necessary
if (global.__RCTProfileIsProfiling) {
  const Systrace = require('Systrace');
  Systrace.installReactHook();
  Systrace.setEnabled(true);
}

// Set up console
const ExceptionsManager = require('ExceptionsManager');
ExceptionsManager.installConsoleErrorReporter();

// Set up error handler
if (!global.__fbDisableExceptionsManager) {
  const handleError = (e, isFatal) => {
    try {
      ExceptionsManager.handleException(e, isFatal);
    } catch (ee) {
      console.log('Failed to print error: ', ee.message);
      throw e;
    }
  };

  const ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleError);
}

// Check for compatibility between the JS and native code
const ReactNativeVersionCheck = require('ReactNativeVersionCheck');
ReactNativeVersionCheck.checkVersions();

// Set up Promise
// The native Promise implementation throws the following error:
// ERROR: Event loop not supported.
polyfillGlobal('Promise', () => require('Promise'));

// Set up regenerator.
polyfillGlobal('regeneratorRuntime', () => {
  // The require just sets up the global, so make sure when we first
  // invoke it the global does not exist
  delete global.regeneratorRuntime;

  // regenerator-runtime/runtime exports the regeneratorRuntime object, so we
  // can return it safely.
  return require('regenerator-runtime/runtime');
});

// Set up timers
const defineLazyTimer = name => {
  polyfillGlobal(name, () => require('JSTimers')[name]);
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

// Set up XHR
// The native XMLHttpRequest in Chrome dev tools is CORS aware and won't
// let you fetch anything from the internet
polyfillGlobal('XMLHttpRequest', () => require('XMLHttpRequest'));
polyfillGlobal('FormData', () => require('FormData'));

polyfillGlobal('fetch', () => require('fetch').fetch);
polyfillGlobal('Headers', () => require('fetch').Headers);
polyfillGlobal('Request', () => require('fetch').Request);
polyfillGlobal('Response', () => require('fetch').Response);
polyfillGlobal('WebSocket', () => require('WebSocket'));
polyfillGlobal('Blob', () => require('Blob'));
polyfillGlobal('File', () => require('File'));
polyfillGlobal('FileReader', () => require('FileReader'));
polyfillGlobal('URL', () => require('URL'));

// Set up alert
if (!global.alert) {
  global.alert = function(text) {
    // Require Alert on demand. Requiring it too early can lead to issues
    // with things like Platform not being fully initialized.
    require('Alert').alert('Alert', '' + text);
  };
}

// Set up Geolocation
let navigator = global.navigator;
if (navigator === undefined) {
  global.navigator = navigator = {};
}

// see https://github.com/facebook/react-native/issues/10881
polyfillObjectProperty(navigator, 'product', () => 'ReactNative');
polyfillObjectProperty(navigator, 'geolocation', () => require('Geolocation'));

// Just to make sure the JS gets packaged up. Wait until the JS environment has
// been initialized before requiring them.
const BatchedBridge = require('BatchedBridge');
BatchedBridge.registerLazyCallableModule('Systrace', () => require('Systrace'));
BatchedBridge.registerLazyCallableModule('JSTimers', () => require('JSTimers'));
BatchedBridge.registerLazyCallableModule('HeapCapture', () =>
  require('HeapCapture'),
);
BatchedBridge.registerLazyCallableModule('SamplingProfiler', () =>
  require('SamplingProfiler'),
);
BatchedBridge.registerLazyCallableModule('RCTLog', () => require('RCTLog'));
BatchedBridge.registerLazyCallableModule('RCTDeviceEventEmitter', () =>
  require('RCTDeviceEventEmitter'),
);
BatchedBridge.registerLazyCallableModule('RCTNativeAppEventEmitter', () =>
  require('RCTNativeAppEventEmitter'),
);
BatchedBridge.registerLazyCallableModule('PerformanceLogger', () =>
  require('PerformanceLogger'),
);
BatchedBridge.registerLazyCallableModule('JSDevSupportModule', () =>
  require('JSDevSupportModule'),
);

global.__fetchSegment = function(
  segmentId: number,
  options: {|+otaBuildNumber: ?string|},
  callback: (?Error) => void,
) {
  const {SegmentFetcher} = require('NativeModules');
  if (!SegmentFetcher) {
    throw new Error(
      'SegmentFetcher is missing. Please ensure that it is ' +
        'included as a NativeModule.',
    );
  }

  SegmentFetcher.fetchSegment(
    segmentId,
    options,
    (errorObject: ?{message: string, code: string}) => {
      if (errorObject) {
        const error = new Error(errorObject.message);
        (error: any).code = errorObject.code;
        callback(error);
      }

      callback(null);
    },
  );
};

// Set up devtools
if (__DEV__) {
  if (!global.__RCTProfileIsProfiling) {
    BatchedBridge.registerCallableModule('HMRClient', require('HMRClient'));

    // not when debugging in chrome
    // TODO(t12832058) This check is broken
    if (!window.document) {
      require('setupDevtools');
    }

    // Set up inspector
    const JSInspector = require('JSInspector');
    JSInspector.registerAgent(require('NetworkAgent'));
  }
}
