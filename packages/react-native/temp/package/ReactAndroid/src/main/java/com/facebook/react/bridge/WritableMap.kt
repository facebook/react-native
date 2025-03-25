/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/** Interface for a mutable map. Used to pass arguments from Kotlin to JS. */
public interface WritableMap : ReadableMap {
  public fun copy(): WritableMap

  public fun merge(source: ReadableMap)

  public fun putArray(key: String, value: ReadableArray?)

  public fun putBoolean(key: String, value: Boolean)

  public fun putDouble(key: String, value: Double)

  public fun putInt(key: String, value: Int)

  public fun putLong(key: String, value: Long)

  public fun putMap(key: String, value: ReadableMap?)

  public fun putNull(key: String)

  public fun putString(key: String, value: String?)
}
