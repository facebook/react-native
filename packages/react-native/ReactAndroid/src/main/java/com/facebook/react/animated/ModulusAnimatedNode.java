/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReadableMap;

/*package*/ @Nullsafe(Nullsafe.Mode.LOCAL)
class ModulusAnimatedNode extends ValueAnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mInputNode;
  private final double mModulus;

  public ModulusAnimatedNode(
      ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mInputNode = config.getInt("input");
    mModulus = config.getDouble("modulus");
  }

  @Override
  public void update() {
    AnimatedNode animatedNode = mNativeAnimatedNodesManager.getNodeById(mInputNode);
    if (animatedNode != null && animatedNode instanceof ValueAnimatedNode) {
      double value = ((ValueAnimatedNode) animatedNode).getValue();
      mValue = (value % mModulus + mModulus) % mModulus;
    } else {
      throw new JSApplicationCausedNativeException(
          "Illegal node ID set as an input for Animated.modulus node");
    }
  }

  public String prettyPrint() {
    return "NativeAnimatedNodesManager["
        + mTag
        + "] inputNode: "
        + mInputNode
        + " modulus: "
        + mModulus
        + " super: "
        + super.prettyPrint();
  }
}
