/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import java.util.HashMap;
import java.util.Map;

/**
 * Native counterpart of style animated node (see AnimatedStyle class in AnimatedImplementation.js)
 */
/*package*/ class StyleAnimatedNode extends AnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final Map<String, Integer> mPropMapping;

  StyleAnimatedNode(ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    ReadableMap style = config.getMap("style");
    ReadableMapKeySetIterator iter = style.keySetIterator();
    mPropMapping = new HashMap<>();
    while (iter.hasNextKey()) {
      String propKey = iter.nextKey();
      int nodeIndex = style.getInt(propKey);
      mPropMapping.put(propKey, nodeIndex);
    }
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
  }

  public void collectViewUpdates(JavaOnlyMap propsMap) {
    for (Map.Entry<String, Integer> entry : mPropMapping.entrySet()) {
      @Nullable AnimatedNode node = mNativeAnimatedNodesManager.getNodeById(entry.getValue());
      if (node == null) {
        throw new IllegalArgumentException("Mapped style node does not exists");
      } else if (node instanceof TransformAnimatedNode) {
        ((TransformAnimatedNode) node).collectViewUpdates(propsMap);
      } else if (node instanceof ValueAnimatedNode) {
        propsMap.putDouble(entry.getKey(), ((ValueAnimatedNode) node).getValue());
      } else if (node instanceof ColorAnimatedNode) {
        propsMap.putInt(entry.getKey(), ((ColorAnimatedNode) node).getColor());
      } else {
        throw new IllegalArgumentException(
            "Unsupported type of node used in property node " + node.getClass());
      }
    }
  }

  public String prettyPrint() {
    return "StyleAnimatedNode["
        + mTag
        + "] mPropMapping: "
        + (mPropMapping != null ? mPropMapping.toString() : "null");
  }
}
