/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

public interface JavaScriptExecutorFactory {
  JavaScriptExecutor create() throws Exception;

  /**
   * Starts the sampling profiler for this specific JavaScriptExecutor Sampling profiler is usually
   * a singleton on the runtime, hence the method exists here and not in {@link JavaScriptExecutor}
   */
  void startSamplingProfiler();

  /**
   * Stops the Sampling profile
   *
   * @param filename The filename where the results of the sampling profiler are dumped to
   */
  void stopSamplingProfiler(String filename);
}
