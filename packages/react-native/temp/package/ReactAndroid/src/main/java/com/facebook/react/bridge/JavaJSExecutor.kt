/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

/**
 * This is class represents java version of native js executor interface. When set through
 * [ProxyJavaScriptExecutor] as a [CatalystInstance] executor, native code will delegate js calls to
 * the given implementation of this interface.
 */
@DoNotStrip
public interface JavaJSExecutor {
  public interface Factory {
    @Throws(Exception::class) public fun create(): JavaJSExecutor?
  }

  public class ProxyExecutorException(cause: Throwable) : Exception(cause)

  /**
   * Close this executor and cleanup any resources that it was using. No further calls are expected
   * after this.
   */
  public fun close()

  /**
   * Load javascript into the js context
   *
   * @param sourceURL url or file location from which script content was loaded
   */
  @DoNotStrip @Throws(ProxyExecutorException::class) public fun loadBundle(sourceURL: String)

  /**
   * Execute javascript method within js context
   *
   * @param methodName name of the method to be executed
   * @param jsonArgsArray json encoded array of arguments provided for the method call
   * @return json encoded value returned from the method call
   */
  @DoNotStrip
  @Throws(ProxyExecutorException::class)
  public fun executeJSCall(methodName: String, jsonArgsArray: String?): String?

  @DoNotStrip public fun setGlobalVariable(propertyName: String, jsonEncodedValue: String)
}
