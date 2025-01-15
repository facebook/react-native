/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.proguard.annotations.DoNotStripAny

/**
 * An implementation of [Dynamic] that has a C++ implementation.
 *
 * This is used to support Legacy Native Modules that have not been migrated to the new architecture
 * and are using [Dynamic] as a parameter type.
 */
@DoNotStripAny
private class DynamicNative(
    @Suppress("NoHungarianNotation") @field:DoNotStrip private val mHybridData: HybridData?
) : Dynamic {

  override val type: ReadableType
    get() = getTypeNative()

  override val isNull: Boolean
    get() = isNullNative()

  private external fun getTypeNative(): ReadableType

  private external fun isNullNative(): Boolean

  external override fun asBoolean(): Boolean

  // The native representation is holding the value as Double. We do the Int conversion here.
  override fun asInt(): Int = asDouble().toInt()

  external override fun asDouble(): Double

  external override fun asString(): String

  external override fun asArray(): ReadableArray

  external override fun asMap(): ReadableMap

  override fun recycle() {
    // Noop - nothing to recycle since there is no pooling
  }
}
