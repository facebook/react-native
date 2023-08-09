/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {IPerformanceLogger} from './createPerformanceLogger';

import ReactNativeFeatureFlags from '../ReactNative/ReactNativeFeatureFlags';
import NativePerformance from '../WebPerformance/NativePerformance';
import createPerformanceLogger from './createPerformanceLogger';

function isLoggingForWebPerformance(): boolean {
  return (
    NativePerformance != null &&
    ReactNativeFeatureFlags.isGlobalWebPerformanceLoggerEnabled()
  );
}

/**
 * This is a global shared instance of IPerformanceLogger that is created with
 * createPerformanceLogger().
 * This logger should be used only for global performance metrics like the ones
 * that are logged during loading bundle. If you want to log something from your
 * React component you should use PerformanceLoggerContext instead.
 */
const GlobalPerformanceLogger: IPerformanceLogger = createPerformanceLogger(
  isLoggingForWebPerformance(),
);

module.exports = GlobalPerformanceLogger;
