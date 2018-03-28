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

/*package*/ class ModulusAnimatedNode extends ValueAnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mInputNode;
  private final double mModulus;

  public ModulusAnimatedNode(
      ReadableMap config,
      NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mInputNode = config.getInt("input");
    mModulus = config.getDouble("modulus");
  }

  @Override
  public void update() {
    AnimatedNode animatedNode = mNativeAnimatedNodesManager.getNodeById(mInputNode);
    if (animatedNode != null && animatedNode instanceof ValueAnimatedNode) {
      mValue = ((ValueAnimatedNode) animatedNode).getValue() % mModulus;
    } else {
      throw new JSApplicationCausedNativeException("Illegal node ID set as an input for " +
        "Animated.modulus node");
    }
  }
}
