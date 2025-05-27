/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use client';

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

require('../../src/private/setup/setUpDefaultReactNativeEnvironment').default();

const GlobalPerformanceLogger =
  require('../Utilities/GlobalPerformanceLogger').default;
// We could just call GlobalPerformanceLogger.markPoint at the top of the file,
// but then we'd be excluding the time it took to require the logger.
// Instead, we just use Date.now and backdate the timestamp.
GlobalPerformanceLogger.markPoint(
  'initializeCore_start',
  GlobalPerformanceLogger.currentTimestamp() - (Date.now() - start),
);
GlobalPerformanceLogger.markPoint('initializeCore_end');
