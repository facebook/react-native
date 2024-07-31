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
 * Animated node that plays a role of value aggregator. It takes two or more value nodes as an input
 * and outputs a sum of values outputted by those nodes.
 */
/*package*/
internal class AdditionAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager
) : ValueAnimatedNode() {

  private val inputNodes: IntArray

  init {
    val inputNodes = config.getArray("input")
    this.inputNodes = IntArray(inputNodes?.size() ?: 0)

    if (inputNodes != null) {
      for (i in this.inputNodes.indices) {
        this.inputNodes[i] = inputNodes.getInt(i)
      }
    }
  }

  override fun update() {
    nodeValue = 0.0
    for (i in inputNodes.indices) {
      val animatedNode = nativeAnimatedNodesManager.getNodeById(inputNodes[i])
      nodeValue +=
          if (animatedNode != null && animatedNode is ValueAnimatedNode) {
            animatedNode.getValue()
          } else {
            throw JSApplicationCausedNativeException(
                "Illegal node ID set as an input for Animated.Add node")
          }
    }
  }

  override fun prettyPrint(): String =
      "AdditionAnimatedNode[${tag}]: input nodes: ${inputNodes.toString()} - super: ${super.prettyPrint()}"
}
