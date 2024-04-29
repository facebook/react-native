/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Type representing a piece of data with unknown runtime type. Useful for allowing javascript to
 * pass one of multiple types down to the native layer.
 */
public interface Dynamic {
  public fun asArray(): ReadableArray

  public fun asBoolean(): Boolean

  public fun asDouble(): Double

  public fun asInt(): Int

  public fun asMap(): ReadableMap

  public fun asString(): String

  public fun getType(): ReadableType

  public fun isNull(): Boolean

  public fun recycle(): Unit
}
