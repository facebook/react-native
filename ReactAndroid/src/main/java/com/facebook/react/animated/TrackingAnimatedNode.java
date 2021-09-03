/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReadableMap;

/* package */ class TrackingAnimatedNode extends AnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mAnimationId;
  private final int mToValueNode;
  private final int mValueNode;
  private final JavaOnlyMap mAnimationConfig;

  TrackingAnimatedNode(ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mAnimationId = config.getInt("animationId");
    mToValueNode = config.getInt("toValue");
    mValueNode = config.getInt("value");
    mAnimationConfig = JavaOnlyMap.deepClone(config.getMap("animationConfig"));
  }

  @Override
  public void update() {
    AnimatedNode toValue = mNativeAnimatedNodesManager.getNodeById(mToValueNode);
    mAnimationConfig.putDouble("toValue", ((ValueAnimatedNode) toValue).getValue());
    mNativeAnimatedNodesManager.startAnimatingNode(
        mAnimationId, mValueNode, mAnimationConfig, null);
  }

  @Override
  public String prettyPrint() {
    return "TrackingAnimatedNode["
        + mTag
        + "]: animationID: "
        + mAnimationId
        + " toValueNode: "
        + mToValueNode
        + " valueNode: "
        + mValueNode
        + " animationConfig: "
        + mAnimationConfig;
  }
}
