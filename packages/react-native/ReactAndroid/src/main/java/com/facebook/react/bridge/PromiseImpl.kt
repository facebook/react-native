/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

/**
 * Implementation of [Promise] that represents a JavaScript Promise which can be passed to the
 * native module as a method parameter. Methods annotated with [ReactMethod] that use a [Promise] as
 * the last parameter will be marked as "promise" and will return a promise when invoked from
 * JavaScript.
 */
@DoNotStrip
public class PromiseImpl
@DoNotStrip
constructor(private var resolve: Callback?, private var reject: Callback?) : Promise {
  /**
   * Successfully resolve the [Promise] with an optional value.
   *
   * @param value Object
   */
  override fun resolve(value: Any?) {
    resolve?.let { callback ->
      callback.invoke(value)
      resolve = null
      reject = null
    }
  }

  /**
   * Report an error without an exception using a custom code and error message.
   *
   * @param code String
   * @param message String
   */
  override fun reject(code: String, message: String?) {
    reject(code, message, null, null)
  }

  /**
   * Report an exception with a custom code.
   *
   * @param code String
   * @param throwable Throwable
   */
  override fun reject(code: String, throwable: Throwable?) {
    reject(code, null, throwable, null)
  }

  /**
   * Report an exception with a custom code and error message.
   *
   * @param code String
   * @param message String
   * @param throwable Throwable
   */
  override fun reject(code: String, message: String?, throwable: Throwable?) {
    reject(code, message, throwable, null)
  }

  /**
   * Report an exception, with default error code. Useful in catch-all scenarios where it's unclear
   * why the error occurred.
   *
   * @param throwable Throwable
   */
  override fun reject(throwable: Throwable) {
    reject(null, null, throwable, null)
  }

  /* ---------------------------
   *  With userInfo WritableMap
   * --------------------------- */

  /**
   * Report an exception, with default error code, with userInfo. Useful in catch-all scenarios
   * where it's unclear why the error occurred.
   *
   * @param throwable Throwable
   * @param userInfo WritableMap
   */
  override fun reject(throwable: Throwable, userInfo: WritableMap) {
    reject(null, null, throwable, userInfo)
  }

  /**
   * Reject with a code and userInfo WritableMap.
   *
   * @param code String
   * @param userInfo WritableMap
   */
  override fun reject(code: String, userInfo: WritableMap) {
    reject(code, null, null, userInfo)
  }

  /**
   * Report an exception with a custom code and userInfo.
   *
   * @param code String
   * @param throwable Throwable
   * @param userInfo WritableMap
   */
  override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) {
    reject(code, null, throwable, userInfo)
  }

  /**
   * Report an error with a custom code, error message and userInfo, an error not caused by an
   * exception.
   *
   * @param code String
   * @param message String
   * @param userInfo WritableMap
   */
  override fun reject(code: String, message: String?, userInfo: WritableMap) {
    reject(code, message, null, userInfo)
  }

  /**
   * Report an exception with a custom code, error message and userInfo.
   *
   * @param code String
   * @param message String
   * @param throwable Throwable
   * @param userInfo WritableMap
   */
  override fun reject(
      code: String?,
      message: String?,
      throwable: Throwable?,
      userInfo: WritableMap?,
  ) {
    if (reject == null) {
      resolve = null
      return
    }

    val errorInfo = WritableNativeMap()

    if (code == null) {
      errorInfo.putString(ERROR_MAP_KEY_CODE, ERROR_DEFAULT_CODE)
    } else {
      errorInfo.putString(ERROR_MAP_KEY_CODE, code)
    }

    // Use the custom message if provided otherwise use the throwable message.
    if (message != null) {
      errorInfo.putString(ERROR_MAP_KEY_MESSAGE, message)
    } else if (throwable != null) {
      var throwableMessage = throwable.message
      // Fallback to the throwable name, so we record some useful information
      if (throwableMessage.isNullOrEmpty()) {
        throwableMessage = throwable.javaClass.canonicalName
      }
      errorInfo.putString(ERROR_MAP_KEY_MESSAGE, throwableMessage)
    } else {
      // The JavaScript side expects a map with at least an error message.
      // /Libraries/BatchedBridge/NativeModules.js -> createErrorFromErrorData
      // TYPE: (errorData: { message: string })
      errorInfo.putString(ERROR_MAP_KEY_MESSAGE, ERROR_DEFAULT_MESSAGE)
    }

    // For consistency with iOS ensure userInfo key exists, even if we null it.
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    if (userInfo != null) {
      errorInfo.putMap(ERROR_MAP_KEY_USER_INFO, userInfo)
    } else {
      errorInfo.putNull(ERROR_MAP_KEY_USER_INFO)
    }

    // Attach a nativeStackAndroid array if a throwable was passed
    // this matches iOS behavior - iOS adds a `nativeStackIOS` property
    // iOS: /React/Base/RCTUtils.m -> RCTJSErrorFromCodeMessageAndNSError
    if (throwable != null) {
      errorInfo.putString(ERROR_MAP_KEY_NAME, throwable.javaClass.canonicalName)

      val stackTrace = throwable.stackTrace
      val nativeStackAndroid = WritableNativeArray()

      // Build an an Array of StackFrames to match JavaScript:
      // iOS: /Libraries/Core/Devtools/parseErrorStack.js -> StackFrame
      var i = 0
      while (i < stackTrace.size && i < ERROR_STACK_FRAME_LIMIT) {
        val frame = stackTrace[i]
        val frameMap: WritableMap = WritableNativeMap()
        // NOTE: no column number exists StackTraceElement
        frameMap.putString(STACK_FRAME_KEY_CLASS, frame.className)
        frameMap.putString(STACK_FRAME_KEY_FILE, frame.fileName)
        frameMap.putInt(STACK_FRAME_KEY_LINE_NUMBER, frame.lineNumber)
        frameMap.putString(STACK_FRAME_KEY_METHOD_NAME, frame.methodName)
        nativeStackAndroid.pushMap(frameMap)
        i++
      }

      errorInfo.putArray(ERROR_MAP_KEY_NATIVE_STACK, nativeStackAndroid)
    } else {
      errorInfo.putArray(ERROR_MAP_KEY_NATIVE_STACK, WritableNativeArray())
    }

    reject?.invoke(errorInfo)
    resolve = null
    reject = null
  }

  /* ------------
   *  Deprecated
   * ------------ */

  @Deprecated("Use reject(code, message) instead.", ReplaceWith("reject(code, message)"))
  override fun reject(message: String) {
    reject(null, message, null, null)
  }

  private companion object {
    // Number of stack frames to parse and return to reject.invoke
    // for ERROR_MAP_KEY_NATIVE_STACK
    private const val ERROR_STACK_FRAME_LIMIT = 50

    private const val ERROR_DEFAULT_CODE = "EUNSPECIFIED"
    private const val ERROR_DEFAULT_MESSAGE = "Error not specified."

    // Keys for reject's WritableMap
    private const val ERROR_MAP_KEY_CODE = "code"
    private const val ERROR_MAP_KEY_MESSAGE = "message"
    private const val ERROR_MAP_KEY_NAME = "name"
    private const val ERROR_MAP_KEY_USER_INFO = "userInfo"
    private const val ERROR_MAP_KEY_NATIVE_STACK = "nativeStackAndroid"

    // Keys for ERROR_MAP_KEY_NATIVE_STACK's StackFrame maps
    private const val STACK_FRAME_KEY_CLASS = "class"
    private const val STACK_FRAME_KEY_FILE = "file"
    private const val STACK_FRAME_KEY_LINE_NUMBER = "lineNumber"
    private const val STACK_FRAME_KEY_METHOD_NAME = "methodName"
  }
}
