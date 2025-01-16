/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * If thrown during a MountItem execution, FabricUIManager will print diagnostics and ignore the
 * error. Use this carefully and sparingly!
 */
public class ReactIgnorableMountingException : RuntimeException {

  public constructor(m: String) : super(m)

  public constructor(e: Throwable) : super(e)

  public constructor(m: String, e: Throwable) : super(m, e)

  public companion object {
    @JvmStatic
    public fun isIgnorable(e: Throwable): Boolean {
      var cause: Throwable? = e
      while (cause != null) {
        if (cause is ReactIgnorableMountingException) {
          return true
        }
        cause = cause.cause
      }
      return false
    }
  }
}
