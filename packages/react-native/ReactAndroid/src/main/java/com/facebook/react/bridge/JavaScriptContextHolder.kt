/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import androidx.annotation.GuardedBy

/**
 * Wrapper for JavaScriptContext native pointer. This object is creates on demand as part of the
 * initialization of React native, and will call clear() before destroying the VM. People who need
 * the raw JavaScriptContext pointer can synchronize on this wrapper object to guarantee that it
 * will not be destroyed.
 */
public class JavaScriptContextHolder
public constructor(@field:GuardedBy("this") private var context: Long) {
  @GuardedBy("this") public fun get(): Long = context

  @Synchronized
  public fun clear() {
    context = 0
  }
}
