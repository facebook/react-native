/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

// flowlint unsafe-getters-setters:off

import type {ReactNativeStartupTiming as ReactNativeStartupTimingType} from './NativePerformance';

// Read-only object with RN startup timing information.
// This is returned by the performance.reactNativeStartup API.
export default class ReactNativeStartupTiming {
  // All time information here are in ms. To match web spec,
  // the default value for timings are zero if not present.
  // See https://www.w3.org/TR/performance-timeline/#performancetiming-interface
  _startTime = 0;
  _endTime = 0;
  _executeJavaScriptBundleEntryPointStart = 0;
  _executeJavaScriptBundleEntryPointEnd = 0;

  constructor(startUpTiming: ?ReactNativeStartupTimingType) {
    if (startUpTiming != null) {
      this._startTime = startUpTiming.startTime;
      this._endTime = startUpTiming.endTime;
      this._executeJavaScriptBundleEntryPointStart =
        startUpTiming.executeJavaScriptBundleEntryPointStart;
      this._executeJavaScriptBundleEntryPointEnd =
        startUpTiming.executeJavaScriptBundleEntryPointEnd;
    }
  }

  /**
   *  Start time of the RN app startup process. This is provided by the platform by implementing the `ReactMarker.setAppStartTime` API in the native platform code.
   */
  get startTime(): number {
    return this._startTime;
  }

  /**
   * End time of the RN app startup process. This is equal to `executeJavaScriptBundleEntryPointEnd`.
   */
  get endTime(): number {
    return this._endTime;
  }

  /**
   * Start time of JS bundle being executed. This indicates the RN JS bundle is loaded and start to be evaluated.
   */
  get executeJavaScriptBundleEntryPointStart(): number {
    return this._executeJavaScriptBundleEntryPointStart;
  }

  /**
   * End time of JS bundle being executed. This indicates all the synchronous entry point jobs are finished.
   */
  get executeJavaScriptBundleEntryPointEnd(): number {
    return this._executeJavaScriptBundleEntryPointEnd;
  }
}
