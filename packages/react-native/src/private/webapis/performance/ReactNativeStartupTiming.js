/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off

import {setPlatformObject} from '../webidl/PlatformObjects';

type ReactNativeStartupTimingLike = {
  startTime: ?number,
  endTime: ?number,
  initializeRuntimeStart: ?number,
  executeJavaScriptBundleEntryPointStart: ?number,
};

// Read-only object with RN startup timing information.
// This is returned by the performance.reactNativeStartup API.
export default class ReactNativeStartupTiming {
  // All time information here are in ms. The values may be null if not provided.
  // We do NOT match web spect here for two reasons:
  // 1. The `ReactNativeStartupTiming` is non-standard API
  // 2. The timing information is relative to the time origin, which means `0` has valid meaning
  #startTime: ?number;
  #initializeRuntimeStart: ?number;
  #executeJavaScriptBundleEntryPointStart: ?number;
  #endTime: ?number;

  constructor(startUpTiming: ?ReactNativeStartupTimingLike) {
    if (startUpTiming != null) {
      this.#startTime = startUpTiming.startTime;
      this.#initializeRuntimeStart = startUpTiming.initializeRuntimeStart;
      this.#executeJavaScriptBundleEntryPointStart =
        startUpTiming.executeJavaScriptBundleEntryPointStart;
      this.#endTime = startUpTiming.endTime;
    }
  }

  /**
   * Start time of the RN app startup process. This is provided by the platform by implementing the `ReactMarker.setAppStartTime` API in the native platform code.
   */
  get startTime(): ?number {
    return this.#startTime;
  }

  /**
   * End time of the RN app startup process.
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
   * Start time of JS bundle being executed. This indicates the RN JS bundle is loaded and start to be evaluated.
   */
  get executeJavaScriptBundleEntryPointStart(): ?number {
    return this.#executeJavaScriptBundleEntryPointStart;
  }
}

setPlatformObject(ReactNativeStartupTiming);
