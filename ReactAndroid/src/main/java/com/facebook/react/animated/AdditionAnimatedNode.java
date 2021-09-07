/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/**
 * Animated node that plays a role of value aggregator. It takes two or more value nodes as an input
 * and outputs a sum of values outputted by those nodes.
 */
/*package*/ class AdditionAnimatedNode extends ValueAnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int[] mInputNodes;

  public AdditionAnimatedNode(
      ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    ReadableArray inputNodes = config.getArray("input");
    mInputNodes = new int[inputNodes.size()];
    for (int i = 0; i < mInputNodes.length; i++) {
      mInputNodes[i] = inputNodes.getInt(i);
    }
  }

  @Override
  public void update() {
    mValue = 0;
    for (int i = 0; i < mInputNodes.length; i++) {
      AnimatedNode animatedNode = mNativeAnimatedNodesManager.getNodeById(mInputNodes[i]);
      if (animatedNode != null && animatedNode instanceof ValueAnimatedNode) {
        mValue += ((ValueAnimatedNode) animatedNode).getValue();
      } else {
        throw new JSApplicationCausedNativeException(
            "Illegal node ID set as an input for " + "Animated.Add node");
      }
    }
  }

  @Override
  public String prettyPrint() {
    return "AdditionAnimatedNode["
        + mTag
        + "]: input nodes: "
        + (mInputNodes != null ? mInputNodes.toString() : "null")
        + " - super: "
        + super.prettyPrint();
  }
}
