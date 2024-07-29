/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap

/**
 * Native counterpart of transform animated node (see AnimatedTransform class in
 * AnimatedImplementation.js)
 */
internal class TransformAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager
) : AnimatedNode() {
  private open inner class TransformConfig {
    var property: String? = null
  }

  private inner class AnimatedTransformConfig : TransformConfig() {
    var nodeTag = 0
  }

  private inner class StaticTransformConfig : TransformConfig() {
    var value = 0.0
  }

  private val transformConfigs: MutableList<TransformConfig>

  init {
    val transforms = config.getArray("transforms")
    val size = transforms?.size() ?: 0
    transformConfigs = ArrayList(size)
    if (transforms != null) {
      for (i in 0 until size) {
        val transformConfigMap = transforms.getMap(i)
        val property = transformConfigMap.getString("property")
        val type = transformConfigMap.getString("type")
        if (type == "animated") {
          val transformConfig = AnimatedTransformConfig()
          transformConfig.property = property
          transformConfig.nodeTag = transformConfigMap.getInt("nodeTag")
          transformConfigs.add(transformConfig)
        } else {
          val transformConfig = StaticTransformConfig()
          transformConfig.property = property
          transformConfig.value = transformConfigMap.getDouble("value")
          transformConfigs.add(transformConfig)
        }
      }
    }
  }

  public fun collectViewUpdates(propsMap: JavaOnlyMap) {
    val transforms: MutableList<JavaOnlyMap?> = ArrayList(transformConfigs.size)
    for (transformConfig in transformConfigs) {
      val value =
          if (transformConfig is AnimatedTransformConfig) {
            val nodeTag = transformConfig.nodeTag
            val node = nativeAnimatedNodesManager.getNodeById(nodeTag)
            if (node == null) {
              throw IllegalArgumentException("Mapped style node does not exist")
            } else if (node is ValueAnimatedNode) {
              node.getValue()
            } else {
              throw IllegalArgumentException(
                  "Unsupported type of node used as a transform child " + "node " + node.javaClass)
            }
          } else {
            (transformConfig as StaticTransformConfig).value
          }
      transforms.add(JavaOnlyMap.of(transformConfig.property, value))
    }
    propsMap.putArray("transform", JavaOnlyArray.from(transforms))
  }

  override fun prettyPrint(): String =
      "TransformAnimatedNode[$tag]: transformConfigs: $transformConfigs"
}
