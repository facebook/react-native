/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/**
 * Native counterpart of object animated node (see AnimatedObject class in
 * AnimatedImplementation.js)
 */
internal class ObjectAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : AnimatedNode() {
  private val configClone: JavaOnlyMap = JavaOnlyMap.deepClone(config)

  fun collectViewUpdates(propKey: String, propsMap: JavaOnlyMap) {
    val valueType = configClone.getType(VALUE_KEY)
    if (valueType == ReadableType.Map) {
      propsMap.putMap(propKey, collectViewUpdatesHelper(configClone.getMap(VALUE_KEY)))
    } else if (valueType == ReadableType.Array) {
      propsMap.putArray(propKey, collectViewUpdatesHelper(configClone.getArray(VALUE_KEY)))
    } else {
      throw IllegalArgumentException("Invalid value type for ObjectAnimatedNode")
    }
  }

  private fun collectViewUpdatesHelper(source: ReadableArray?): JavaOnlyArray? {
    source ?: return null
    val result = JavaOnlyArray()
    for (i in 0 until source.size()) {
      when (source.getType(i)) {
        ReadableType.Null -> result.pushNull()
        ReadableType.Boolean -> result.pushBoolean(source.getBoolean(i))
        ReadableType.Number -> result.pushDouble(source.getDouble(i))
        ReadableType.String -> result.pushString(source.getString(i))
        ReadableType.Map -> {
          val map = source.getMap(i)
          if (
              map != null &&
                  map.hasKey(NODE_TAG_KEY) &&
                  map.getType(NODE_TAG_KEY) == ReadableType.Number
          ) {
            val node = nativeAnimatedNodesManager.getNodeById(map.getInt(NODE_TAG_KEY))
            requireNotNull(node) { "Mapped value node does not exist" }
            if (node is ValueAnimatedNode) {
              val animatedObject = node.getAnimatedObject()
              if (animatedObject is Int) {
                result.pushInt(animatedObject)
              } else if (animatedObject is String) {
                result.pushString(animatedObject)
              } else {
                result.pushDouble(node.getValue())
              }
            } else if (node is ColorAnimatedNode) {
              result.pushInt(node.color)
            }
          } else {
            result.pushMap(collectViewUpdatesHelper(source.getMap(i)))
          }
        }
        ReadableType.Array -> result.pushArray(collectViewUpdatesHelper(source.getArray(i)))
      }
    }
    return result
  }

  private fun collectViewUpdatesHelper(source: ReadableMap?): JavaOnlyMap? {
    source ?: return null
    val result = JavaOnlyMap()
    val iter = source.keySetIterator()
    while (iter.hasNextKey()) {
      val propKey = iter.nextKey()
      when (source.getType(propKey)) {
        ReadableType.Null -> result.putNull(propKey)
        ReadableType.Boolean -> result.putBoolean(propKey, source.getBoolean(propKey))
        ReadableType.Number -> result.putDouble(propKey, source.getDouble(propKey))
        ReadableType.String -> result.putString(propKey, source.getString(propKey))
        ReadableType.Map -> {
          val map = source.getMap(propKey)
          if (
              map != null &&
                  map.hasKey(NODE_TAG_KEY) &&
                  map.getType(NODE_TAG_KEY) == ReadableType.Number
          ) {
            val node = nativeAnimatedNodesManager.getNodeById(map.getInt(NODE_TAG_KEY))
            requireNotNull(node) { "Mapped value node does not exist" }
            if (node is ValueAnimatedNode) {
              val animatedObject = node.getAnimatedObject()
              if (animatedObject is Int) {
                result.putInt(propKey, animatedObject)
              } else if (animatedObject is String) {
                result.putString(propKey, animatedObject)
              } else {
                result.putDouble(propKey, node.getValue())
              }
            } else if (node is ColorAnimatedNode) {
              result.putInt(propKey, node.color)
            }
          } else {
            result.putMap(propKey, collectViewUpdatesHelper(map))
          }
        }
        ReadableType.Array ->
            result.putArray(propKey, collectViewUpdatesHelper(source.getArray(propKey)))
      }
    }
    return result
  }

  override fun prettyPrint(): String = "ObjectAnimatedNode[$tag]: mConfig: $configClone"

  companion object {
    private const val VALUE_KEY = "value"
    private const val NODE_TAG_KEY = "nodeTag"
  }
}
