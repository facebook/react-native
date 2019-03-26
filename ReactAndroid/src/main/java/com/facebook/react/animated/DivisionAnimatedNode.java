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
 * Animated node which takes two or more value node as an input and outputs an in-order
 * division of their values.
 */
/*package*/ class DivisionAnimatedNode extends ValueAnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int[] mInputNodes;

  public DivisionAnimatedNode(
      ReadableMap config,
      NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    ReadableArray inputNodes = config.getArray("input");
    mInputNodes = new int[inputNodes.size()];
    for (int i = 0; i < mInputNodes.length; i++) {
      mInputNodes[i] = inputNodes.getInt(i);
    }
  }

  @Override
  public void update() {
    for (int i = 0; i < mInputNodes.length; i++) {
      AnimatedNode animatedNode = mNativeAnimatedNodesManager.getNodeById(mInputNodes[i]);
      if (animatedNode != null && animatedNode instanceof ValueAnimatedNode) {
        double value = ((ValueAnimatedNode) animatedNode).getValue();
        if (i == 0) {
          mValue = value;
          continue;
        }
        if (value == 0) {
          throw new JSApplicationCausedNativeException("Detected a division by zero in " +
            "Animated.divide node");
        }
        mValue /= value;
      } else {
        throw new JSApplicationCausedNativeException("Illegal node ID set as an input for " +
          "Animated.divide node");
      }
    }
  }
}
