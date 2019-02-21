/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

const start = Date.now();

require('setUpGlobals');
require('polyfillES6Collections');
require('setUpSystrace');
require('setUpErrorHandling');
require('checkNativeVersion');
require('polyfillPromise');
require('setUpRegeneratorRuntime');
require('setUpTimers');
require('setUpXHR');
require('setUpAlert');
require('setUpGeolocation');
require('setUpBatchedBridge');
require('setUpSegmentFetcher');
if (__DEV__) {
  require('setUpDeveloperTools');
}

const PerformanceLogger = require('PerformanceLogger');
// We could just call PerformanceLogger.markPoint at the top of the file,
// but then we'd be excluding the time it took to require PerformanceLogger.
// Instead, we just use Date.now and backdate the timestamp.
PerformanceLogger.markPoint(
  'initializeCore_start',
  PerformanceLogger.currentTimestamp() - (Date.now() - start),
);
PerformanceLogger.markPoint('initializeCore_end');
