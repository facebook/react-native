/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.ReadableMap

/**
 * Animated node which takes two or more value node as an input and outputs an in-order division of
 * their values.
 */
internal class DivisionAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager
) : ValueAnimatedNode() {
  private val inputNodes: IntArray

  init {
    val nodes = config.getArray("input")
    val size = nodes?.size() ?: 0
    inputNodes = IntArray(size)
    if (nodes != null) {
      for (i in inputNodes.indices) {
        inputNodes[i] = nodes.getInt(i)
      }
    }
  }

  override fun update() {
    for (i in inputNodes.indices) {
      val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNodes[i])
      if (animatedNode != null && animatedNode is ValueAnimatedNode) {
        val value = animatedNode.nodeValue
        if (i == 0) {
          nodeValue = value
          continue
        }
        if (value == 0.0) {
          throw JSApplicationCausedNativeException(
              "Detected a division by zero in Animated.divide node with Animated ID $tag")
        }
        nodeValue /= value
      } else {
        throw JSApplicationCausedNativeException(
            "Illegal node ID set as an input for Animated.divide node with Animated ID $tag")
      }
    }
  }

  override fun prettyPrint(): String =
      "DivisionAnimatedNode[$tag]: input nodes: $inputNodes - super: ${super.prettyPrint()}"
}
