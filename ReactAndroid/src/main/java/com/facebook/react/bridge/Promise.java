/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

/**
 * Interface that represents a JavaScript Promise which can be passed to the native module as a
 * method parameter.
 *
 * Methods annotated with {@link ReactMethod} that use {@link Promise} as type of the last parameter
 * will be marked as "promise" and will return a promise when invoked from JavaScript.
 */
public interface Promise {

  /**
   * Successfully resolve the Promise.
   */
  void resolve(@Nullable Object value);

  /**
   * Report an error which wasn't caused by an exception.
   */
  void reject(String code, String message);

  /**
   * Report an exception.
   */
  void reject(String code, Throwable e);

  /**
   * Report an exception with a custom error message.
   */
  void reject(String code, String message, Throwable e);

  /**
   * Report an error which wasn't caused by an exception.
   * @deprecated Prefer passing a module-specific error code to JS.
   *             Using this method will pass the error code "EUNSPECIFIED".
   */
  @Deprecated
  void reject(String message);

  /**
   * Report an exception, with default error code.
   * Useful in catch-all scenarios where it's unclear why the error occurred.
   */
  void reject(Throwable reason);
}
