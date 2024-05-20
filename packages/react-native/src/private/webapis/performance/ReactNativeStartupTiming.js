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

type ReactNativeStartupTimingLike = {
  startTime: ?number,
  endTime: ?number,
  initializeRuntimeStart: ?number,
  initializeRuntimeEnd: ?number,
  executeJavaScriptBundleEntryPointStart: ?number,
  executeJavaScriptBundleEntryPointEnd: ?number,
};

// Read-only object with RN startup timing information.
// This is returned by the performance.reactNativeStartup API.
export default class ReactNativeStartupTiming {
  // All time information here are in ms. The values may be null if not provided.
  // We do NOT match web spect here for two reasons:
  // 1. The `ReactNativeStartupTiming` is non-standard API
  // 2. The timing information is relative to the time origin, which means `0` has valid meaning
  #startTime: ?number;
  #endTime: ?number;
  #initializeRuntimeStart: ?number;
  #initializeRuntimeEnd: ?number;
  #executeJavaScriptBundleEntryPointStart: ?number;
  #executeJavaScriptBundleEntryPointEnd: ?number;

  constructor(startUpTiming: ?ReactNativeStartupTimingLike) {
    if (startUpTiming != null) {
      this.#startTime = startUpTiming.startTime;
      this.#endTime = startUpTiming.endTime;
      this.#initializeRuntimeStart = startUpTiming.initializeRuntimeStart;
      this.#initializeRuntimeEnd = startUpTiming.initializeRuntimeEnd;
      this.#executeJavaScriptBundleEntryPointStart =
        startUpTiming.executeJavaScriptBundleEntryPointStart;
      this.#executeJavaScriptBundleEntryPointEnd =
        startUpTiming.executeJavaScriptBundleEntryPointEnd;
    }
  }

  /**
   * Start time of the RN app startup process. This is provided by the platform by implementing the `ReactMarker.setAppStartTime` API in the native platform code.
   */
  get startTime(): ?number {
    return this.#startTime;
  }

  /**
   * End time of the RN app startup process. This is equal to `executeJavaScriptBundleEntryPointEnd`.
   */
  get endTime(): ?number {
    return this.#endTime;
  }

  /**
   * Start time when RN runtime get initialized. This is when RN infra first kicks in app startup process.
   */
  get initializeRuntimeStart(): ?number {
    return this.#initializeRuntimeStart;
  }

  /**
   * End time when RN runtime get initialized. This is the last marker before ends of the app startup process.
   */
  get initializeRuntimeEnd(): ?number {
    return this.#initializeRuntimeEnd;
  }

  /**
   * Start time of JS bundle being executed. This indicates the RN JS bundle is loaded and start to be evaluated.
   */
  get executeJavaScriptBundleEntryPointStart(): ?number {
    return this.#executeJavaScriptBundleEntryPointStart;
  }

  /**
   * End time of JS bundle being executed. This indicates all the synchronous entry point jobs are finished.
   */
  get executeJavaScriptBundleEntryPointEnd(): ?number {
    return this.#executeJavaScriptBundleEntryPointEnd;
  }
}
