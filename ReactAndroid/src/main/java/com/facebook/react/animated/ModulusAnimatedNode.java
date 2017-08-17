/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.JSApplicationCausedNativeException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

/*package*/ class ModulusAnimatedNode extends ValueAnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mInputNode;
  private final int mModulus;

  public ModulusAnimatedNode(
      ReadableMap config,
      NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mInputNode = config.getInt("input");
    mModulus = config.getInt("modulus");
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
