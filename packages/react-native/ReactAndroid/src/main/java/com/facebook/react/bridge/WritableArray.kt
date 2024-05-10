/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/** Interface for a mutable array. Used to pass arguments from Kotlin to JS. */
public interface WritableArray : ReadableArray {
  public fun pushArray(array: ReadableArray?)

  public fun pushBoolean(value: Boolean)

  public fun pushDouble(value: Double)

  public fun pushInt(value: Int)

  public fun pushLong(value: Long)

  public fun pushMap(map: ReadableMap?)

  public fun pushNull()

  public fun pushString(value: String?)
}
