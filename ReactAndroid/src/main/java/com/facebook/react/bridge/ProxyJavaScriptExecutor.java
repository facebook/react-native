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
    SoLoader.loadLibrary(ReactBridge.REACT_NATIVE_LIB);
  }

  public static class ProxyExecutorException extends Exception {
    public ProxyExecutorException(Throwable cause) {
      super(cause);
    }
  }

  /**
   * This is class represents java version of native js executor interface. When set through
   * {@link ProxyJavaScriptExecutor} as a {@link CatalystInstance} executor, native code will
   * delegate js calls to the given implementation of this interface.
   */
  @DoNotStrip
  public interface JavaJSExecutor {
    /**
     * Close this executor and cleanup any resources that it was using. No further calls are
     * expected after this.
     */
    void close();

    /**
     * Load javascript into the js context
     * @param script script contet to be executed
     * @param sourceURL url or file location from which script content was loaded
     */
    @DoNotStrip
    void executeApplicationScript(String script, String sourceURL) throws ProxyExecutorException;

    /**
     * Execute javascript method within js context
     * @param modulename name of the common-js like module to execute the method from
     * @param methodName name of the method to be executed
     * @param jsonArgsArray json encoded array of arguments provided for the method call
     * @return json encoded value returned from the method call
     */
    @DoNotStrip
    String executeJSCall(String modulename, String methodName, String jsonArgsArray)
        throws ProxyExecutorException;

    @DoNotStrip
    void setGlobalVariable(String propertyName, String jsonEncodedValue);
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
