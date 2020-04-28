/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.animated;

import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReadableMap;

/*package*/ class DiffClampAnimatedNode extends ValueAnimatedNode {
  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mInputNodeTag;
  private final double mMin;
  private final double mMax;

  private double mLastValue;

  public DiffClampAnimatedNode(
      ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mInputNodeTag = config.getInt("input");
    mMin = config.getDouble("min");
    mMax = config.getDouble("max");

    mValue = mLastValue = 0;
  }

  @Override
  public void update() {
    double value = getInputNodeValue();

    double diff = value - mLastValue;
    mLastValue = value;
    mValue = Math.min(Math.max(mValue + diff, mMin), mMax);
  }

  private double getInputNodeValue() {
    AnimatedNode animatedNode = mNativeAnimatedNodesManager.getNodeById(mInputNodeTag);
    if (animatedNode == null || !(animatedNode instanceof ValueAnimatedNode)) {
      throw new JSApplicationCausedNativeException(
          "Illegal node ID set as an input for " + "Animated.DiffClamp node");
    }

    return ((ValueAnimatedNode) animatedNode).getValue();
  }
}
