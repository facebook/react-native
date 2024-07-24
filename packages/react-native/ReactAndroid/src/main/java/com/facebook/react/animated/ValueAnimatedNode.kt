/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.ReadableMap

/**
 * Basic type of animated node that maps directly from {@code Animated.Value(x)} of Animated.js
 * library.
 */
internal open class ValueAnimatedNode : AnimatedNode {
  @JvmField internal var mValue: Double = Double.NaN
  @JvmField internal var mOffset: Double = 0.0
  private var mValueListener: AnimatedNodeValueListener? = null

  public constructor() : super() {
    // empty constructor that can be used by subclasses
  }

  public constructor(config: ReadableMap) : super() {
    mValue = config.getDouble("value")
    mOffset = config.getDouble("offset")
  }

  public fun getValue(): Double {
    if ((mOffset + mValue).isNaN()) {
      this.update()
    }
    return mOffset + mValue
  }

  open fun getAnimatedObject(): Any? {
    return null
  }

  public fun flattenOffset(): Unit {
    mValue += mOffset
    mOffset = 0.0
  }

  public fun extractOffset(): Unit {
    mOffset += mValue
    mValue = 0.0
  }

  public fun onValueUpdate(): Unit {
    if (mValueListener == null) {
      return
    }
    requireNotNull(mValueListener).onValueUpdate(getValue())
  }

  public fun setValueListener(listener: AnimatedNodeValueListener?): Unit {
    mValueListener = listener
  }

  override public fun prettyPrint(): String {
    return "ValueAnimatedNode[$mTag]: value: $mValue offset: $mOffset"
  }
}
