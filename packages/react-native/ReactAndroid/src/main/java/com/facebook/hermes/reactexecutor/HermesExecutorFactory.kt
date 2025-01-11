/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor;

import com.facebook.hermes.instrumentation.HermesSamplingProfiler;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;

public class HermesExecutorFactory implements JavaScriptExecutorFactory {
  private static final String TAG = "Hermes";

  private final RuntimeConfig mConfig;
  private boolean mEnableDebugger = true;
  private String mDebuggerName = "";

  public HermesExecutorFactory() {
    this(null);
  }

  public HermesExecutorFactory(RuntimeConfig config) {
    mConfig = config;
  }

  public void setEnableDebugger(boolean enableDebugger) {
    mEnableDebugger = enableDebugger;
  }

  public void setDebuggerName(String debuggerName) {
    mDebuggerName = debuggerName;
  }

  @Override
  public JavaScriptExecutor create() {
    return new HermesExecutor(mConfig, mEnableDebugger, mDebuggerName);
  }

  @Override
  public void startSamplingProfiler() {
    HermesSamplingProfiler.enable();
  }

  @Override
  public void stopSamplingProfiler(String filename) {
    HermesSamplingProfiler.dumpSampledTraceToFile(filename);
    HermesSamplingProfiler.disable();
  }

  @Override
  public String toString() {
    return "JSIExecutor+HermesRuntime";
  }
}
