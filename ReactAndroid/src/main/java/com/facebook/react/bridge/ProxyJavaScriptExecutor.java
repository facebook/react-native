/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import com.facebook.soloader.SoLoader;
import com.facebook.proguard.annotations.DoNotStrip;

/**
 * JavaScript executor that delegates JS calls processed by native code back to a java version
 * of the native executor interface.
 *
 * When set as a executor with {@link CatalystInstance.Builder}, catalyst native code will delegate
 * low level javascript calls to the implementation of {@link JavaJSExecutor} interface provided
 * with the constructor of this class.
 */
@DoNotStrip
public class ProxyJavaScriptExecutor extends JavaScriptExecutor {
  static {
    ReactBridge.staticInit();
  }

  public static class Factory implements JavaScriptExecutor.Factory {
    private final JavaJSExecutor.Factory mJavaJSExecutorFactory;

    public Factory(JavaJSExecutor.Factory javaJSExecutorFactory) {
      mJavaJSExecutorFactory = javaJSExecutorFactory;
    }

    @Override
    public JavaScriptExecutor create(WritableNativeMap jscConfig) throws Exception {
      return new ProxyJavaScriptExecutor(mJavaJSExecutorFactory.create());
    }
  }

  private @Nullable JavaJSExecutor mJavaJSExecutor;

  /**
   * Create {@link ProxyJavaScriptExecutor} instance
   * @param executor implementation of {@link JavaJSExecutor} which will be responsible for handling
   * javascript calls
   */
  public ProxyJavaScriptExecutor(JavaJSExecutor executor) {
    mJavaJSExecutor = executor;
    initialize(executor);
  }

  @Override
  public void close() {
    if (mJavaJSExecutor != null) {
      mJavaJSExecutor.close();
      mJavaJSExecutor = null;
    }
  }

  private native void initialize(JavaJSExecutor executor);

}
