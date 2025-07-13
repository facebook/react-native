/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/*
 * Interface that represents a JavaScript Promise which can be passed to the native module as a
 * method parameter.
 *
 * Methods annotated with [ReactMethod] that use a [Promise] as the last parameter
 * will be marked as "promise" and will return a promise when invoked from JavaScript.
 */
public interface Promise {
  /**
   * Successfully resolve the Promise with an optional value.
   *
   * @param value Object
   */
  public fun resolve(value: Any?)

  /**
   * Report an error without an exception using a custom code and error message.
   *
   * @param code String
   * @param message String
   */
  public fun reject(code: String, message: String?)

  /**
   * Report an exception with a custom code.
   *
   * @param code String
   * @param throwable Throwable
   */
  public fun reject(code: String, throwable: Throwable?)

  /**
   * Report an exception with a custom code and error message.
   *
   * @param code String
   * @param message String
   * @param throwable Throwable
   */
  public fun reject(code: String, message: String?, throwable: Throwable?)

  /**
   * Report an exception, with default error code. Useful in catch-all scenarios where it's unclear
   * why the error occurred.
   *
   * @param throwable Throwable
   */
  public fun reject(throwable: Throwable)

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
  public fun reject(throwable: Throwable, userInfo: WritableMap)

  /**
   * Reject with a code and userInfo WritableMap.
   *
   * @param code String
   * @param userInfo WritableMap
   */
  public fun reject(code: String, userInfo: WritableMap)

  /**
   * Report an exception with a custom code and userInfo.
   *
   * @param code String
   * @param throwable Throwable
   * @param userInfo WritableMap
   */
  public fun reject(code: String, throwable: Throwable?, userInfo: WritableMap)

  /**
   * Report an error with a custom code, error message and userInfo, an error not caused by an
   * exception.
   *
   * @param code String
   * @param message String
   * @param userInfo WritableMap
   */
  public fun reject(code: String, message: String?, userInfo: WritableMap)

  /**
   * Report an exception with a custom code, error message and userInfo.
   *
   * @param code String
   * @param message String
   * @param throwable Throwable
   * @param userInfo WritableMap
   */
  public fun reject(code: String?, message: String?, throwable: Throwable?, userInfo: WritableMap?)

  /** Report an error which wasn't caused by an exception. */
  @Deprecated(
      message =
          """Prefer passing a module-specific error code to JS. Using this method will pass the
        error code EUNSPECIFIED""",
      replaceWith = ReplaceWith("reject(code, message)"))
  public fun reject(message: String)
}
