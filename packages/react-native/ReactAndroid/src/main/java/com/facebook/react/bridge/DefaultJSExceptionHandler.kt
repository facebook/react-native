/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/** Crashy crashy exception handler. */
public class DefaultJSExceptionHandler : JSExceptionHandler {
  override fun handleException(e: Exception) {
    throw if (e is RuntimeException) {
      // Because we are rethrowing the original exception, the original stacktrace will be
      // preserved.
      e
    } else {
      RuntimeException(e)
    }
  }
}
