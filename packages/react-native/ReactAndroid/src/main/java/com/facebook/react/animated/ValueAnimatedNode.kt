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
public open class ValueAnimatedNode(config: ReadableMap? = null) : AnimatedNode() {
  @JvmField internal var nodeValue: Double = config?.getDouble("value") ?: Double.NaN
  @JvmField internal var offset: Double = config?.getDouble("offset") ?: 0.0
  private var valueListener: AnimatedNodeValueListener? = null

  public fun getValue(): Double {
    if ((offset + nodeValue).isNaN()) {
      this.update()
    }
    return offset + nodeValue
  }

  public open fun getAnimatedObject(): Any? = null

  public fun flattenOffset(): Unit {
    nodeValue += offset
    offset = 0.0
  }

  public fun extractOffset(): Unit {
    offset += nodeValue
    nodeValue = 0.0
  }

  public fun onValueUpdate(): Unit {
    valueListener?.onValueUpdate(getValue())
  }

  public fun setValueListener(listener: AnimatedNodeValueListener?): Unit {
    valueListener = listener
  }

  override public fun prettyPrint(): String =
      "ValueAnimatedNode[$tag]: value: $nodeValue offset: $offset"
}
