/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap

internal class TrackingAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager
) : AnimatedNode() {
  private val animationConfig: JavaOnlyMap = JavaOnlyMap.deepClone(config.getMap("animationConfig"))
  private val animationId: Int = config.getInt("animationId")
  private val toValueNode: Int = config.getInt("toValue")
  private val valueNode: Int = config.getInt("value")

  public override fun update() {
    val toValue = nativeAnimatedNodesManager.getNodeById(toValueNode)
    val valAnimatedNode = toValue as? ValueAnimatedNode
    if (valAnimatedNode != null) {
      animationConfig.putDouble("toValue", valAnimatedNode.getValue())
    } else {
      animationConfig.putNull("toValue")
    }
    nativeAnimatedNodesManager.startAnimatingNode(animationId, valueNode, animationConfig, null)
  }

  public override fun prettyPrint(): String =
      "TrackingAnimatedNode[$tag]: animationID: $animationId toValueNode: $toValueNode " +
          "valueNode: $valueNode animationConfig: $animationConfig"
}
