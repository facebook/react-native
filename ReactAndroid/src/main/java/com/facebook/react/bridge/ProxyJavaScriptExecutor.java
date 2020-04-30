/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * JavaScript executor that delegates JS calls processed by native code back to a java version of
 * the native executor interface.
 *
 * <p>When set as a executor with {@link CatalystInstance.Builder}, catalyst native code will
 * delegate low level javascript calls to the implementation of {@link JavaJSExecutor} interface
 * provided with the constructor of this class.
 */
@DoNotStrip
public class ProxyJavaScriptExecutor extends JavaScriptExecutor {
  public static class Factory implements JavaScriptExecutorFactory {
    private final JavaJSExecutor.Factory mJavaJSExecutorFactory;

    public Factory(JavaJSExecutor.Factory javaJSExecutorFactory) {
      mJavaJSExecutorFactory = javaJSExecutorFactory;
    }

    @Override
    public JavaScriptExecutor create() throws Exception {
      return new ProxyJavaScriptExecutor(mJavaJSExecutorFactory.create());
    }

    @Override
    public void startSamplingProfiler() {
      throw new UnsupportedOperationException(
          "Starting sampling profiler not supported on " + toString());
    }

    @Override
    public void stopSamplingProfiler(String filename) {
      throw new UnsupportedOperationException(
          "Stopping sampling profiler not supported on " + toString());
    }
  }

  static {
    ReactBridge.staticInit();
  }

  private @Nullable JavaJSExecutor mJavaJSExecutor;

  /**
   * Create {@link ProxyJavaScriptExecutor} instance
   *
   * @param executor implementation of {@link JavaJSExecutor} which will be responsible for handling
   *     javascript calls
   */
  public ProxyJavaScriptExecutor(JavaJSExecutor executor) {
    super(initHybrid(executor));
    mJavaJSExecutor = executor;
  }

  @Override
  public void close() {
    if (mJavaJSExecutor != null) {
      mJavaJSExecutor.close();
      mJavaJSExecutor = null;
    }
  }

  @Override
  public String getName() {
    return "ProxyJavaScriptExecutor";
  }

  private static native HybridData initHybrid(JavaJSExecutor executor);
}
