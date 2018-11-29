/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * This is class represents java version of native js executor interface. When set through
 * {@link ProxyJavaScriptExecutor} as a {@link CatalystInstance} executor, native code will
 * delegate js calls to the given implementation of this interface.
 */
@DoNotStrip
public interface JavaJSExecutor {
  interface Factory {
    JavaJSExecutor create() throws Exception;
  }

  class ProxyExecutorException extends Exception {
    public ProxyExecutorException(Throwable cause) {
      super(cause);
    }
  }

  /**
   * Close this executor and cleanup any resources that it was using. No further calls are
   * expected after this.
   */
  void close();

  /**
   * Load javascript into the js context
   * @param sourceURL url or file location from which script content was loaded
   */
  @DoNotStrip
  void loadApplicationScript(String sourceURL) throws ProxyExecutorException;

  /**
   * Execute javascript method within js context
   * @param methodName name of the method to be executed
   * @param jsonArgsArray json encoded array of arguments provided for the method call
   * @return json encoded value returned from the method call
   */
  @DoNotStrip
  String executeJSCall(String methodName, String jsonArgsArray)
      throws ProxyExecutorException;

  @DoNotStrip
  void setGlobalVariable(String propertyName, String jsonEncodedValue);
}
