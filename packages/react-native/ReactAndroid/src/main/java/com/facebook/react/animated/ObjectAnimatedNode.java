/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

/**
 * Native counterpart of object animated node (see AnimatedObject class in
 * AnimatedImplementation.js)
 */
/* package */ class ObjectAnimatedNode extends AnimatedNode {

  private static final String VALUE_KEY = "value";
  private static final String NODE_TAG_KEY = "nodeTag";

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final JavaOnlyMap mConfig;

  ObjectAnimatedNode(ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mConfig = JavaOnlyMap.deepClone(config);
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
  }

  public void collectViewUpdates(String propKey, JavaOnlyMap propsMap) {
    ReadableType valueType = mConfig.getType(VALUE_KEY);
    if (valueType == ReadableType.Map) {
      propsMap.putMap(propKey, collectViewUpdatesHelper(mConfig.getMap(VALUE_KEY)));
    } else if (valueType == ReadableType.Array) {
      propsMap.putArray(propKey, collectViewUpdatesHelper(mConfig.getArray(VALUE_KEY)));
    } else {
      throw new IllegalArgumentException("Invalid value type for ObjectAnimatedNode");
    }
  }

  private @Nullable JavaOnlyArray collectViewUpdatesHelper(@Nullable ReadableArray source) {
    if (source == null) {
      return null;
    }

    JavaOnlyArray result = new JavaOnlyArray();
    for (int i = 0; i < source.size(); i++) {
      switch (source.getType(i)) {
        case Null:
          result.pushNull();
          break;
        case Boolean:
          result.pushBoolean(source.getBoolean(i));
          break;
        case Number:
          result.pushDouble(source.getDouble(i));
          break;
        case String:
          result.pushString(source.getString(i));
          break;
        case Map:
          ReadableMap map = source.getMap(i);
          if (map.hasKey(NODE_TAG_KEY) && map.getType(NODE_TAG_KEY) == ReadableType.Number) {
            AnimatedNode node = mNativeAnimatedNodesManager.getNodeById(map.getInt(NODE_TAG_KEY));
            if (node == null) {
              throw new IllegalArgumentException("Mapped value node does not exist");
            } else if (node instanceof ValueAnimatedNode) {
              ValueAnimatedNode valueAnimatedNode = (ValueAnimatedNode) node;
              Object animatedObject = valueAnimatedNode.getAnimatedObject();
              if (animatedObject instanceof Integer) {
                result.pushInt((Integer) animatedObject);
              } else if (animatedObject instanceof String) {
                result.pushString((String) animatedObject);
              } else {
                result.pushDouble(valueAnimatedNode.getValue());
              }
            } else if (node instanceof ColorAnimatedNode) {
              result.pushInt(((ColorAnimatedNode) node).getColor());
            }
          } else {
            result.pushMap(collectViewUpdatesHelper(source.getMap(i)));
          }
          break;
        case Array:
          result.pushArray(collectViewUpdatesHelper(source.getArray(i)));
          break;
      }
    }
    return result;
  }

  private @Nullable JavaOnlyMap collectViewUpdatesHelper(@Nullable ReadableMap source) {
    if (source == null) {
      return null;
    }

    JavaOnlyMap result = new JavaOnlyMap();
    ReadableMapKeySetIterator iter = source.keySetIterator();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      switch (source.getType(propKey)) {
        case Null:
          result.putNull(propKey);
          break;
        case Boolean:
          result.putBoolean(propKey, source.getBoolean(propKey));
          break;
        case Number:
          result.putDouble(propKey, source.getDouble(propKey));
          break;
        case String:
          result.putString(propKey, source.getString(propKey));
          break;
        case Map:
          ReadableMap map = source.getMap(propKey);
          if (map != null
              && map.hasKey(NODE_TAG_KEY)
              && map.getType(NODE_TAG_KEY) == ReadableType.Number) {
            AnimatedNode node = mNativeAnimatedNodesManager.getNodeById(map.getInt(NODE_TAG_KEY));
            if (node == null) {
              throw new IllegalArgumentException("Mapped value node does not exist");
            } else if (node instanceof ValueAnimatedNode) {
              ValueAnimatedNode valueAnimatedNode = (ValueAnimatedNode) node;
              Object animatedObject = valueAnimatedNode.getAnimatedObject();
              if (animatedObject instanceof Integer) {
                result.putInt(propKey, (Integer) animatedObject);
              } else if (animatedObject instanceof String) {
                result.putString(propKey, (String) animatedObject);
              } else {
                result.putDouble(propKey, valueAnimatedNode.getValue());
              }
            } else if (node instanceof ColorAnimatedNode) {
              result.putInt(propKey, ((ColorAnimatedNode) node).getColor());
            }
          } else {
            result.putMap(propKey, collectViewUpdatesHelper(map));
          }
          break;
        case Array:
          result.putArray(propKey, collectViewUpdatesHelper(source.getArray(propKey)));
          break;
      }
    }
    return result;
  }

  @Override
  public String prettyPrint() {
    return "ObjectAnimatedNode["
        + mTag
        + "]: mConfig: "
        + (mConfig != null ? mConfig.toString() : "null");
  }
}
