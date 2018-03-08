/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Animated node which takes one value node as an input and outputs the cosine 
 * of the value.
 */
/*package*/ class CosAnimatedNode extends ValueAnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mInputNode;

  public CosAnimatedNode(
      ReadableMap config,
      NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    ReadableArray inputNodes = config.getArray("input");
    mInputNode = inputNodes.getInt(0);
  }

  @Override
  public void update() {
  AnimatedNode animatedNode = mNativeAnimatedNodesManager.getNodeById(mInputNode);
    if (animatedNode != null && animatedNode instanceof ValueAnimatedNode) {
      mValue = java.lang.Math.cos(((ValueAnimatedNode) animatedNode).getValue());
    } else {
      throw new JSApplicationCausedNativeException("Illegal node ID set as an input for " +
        "Animated.cos node");
    }
  }
}
