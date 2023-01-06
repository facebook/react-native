/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.view.ColorUtil;

/** Animated node that represents a color. */
/*package*/ class ColorAnimatedNode extends AnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final int mRNodeId;
  private final int mGNodeId;
  private final int mBNodeId;
  private final int mANodeId;
  private int mColor;

  public ColorAnimatedNode(
      ReadableMap config, NativeAnimatedNodesManager nativeAnimatedNodesManager) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mRNodeId = config.getInt("r");
    mGNodeId = config.getInt("g");
    mBNodeId = config.getInt("b");
    mANodeId = config.getInt("a");

    // TODO (T110930421): Support platform color
  }

  public int getColor() {
    return mColor;
  }

  @Override
  public void update() {
    AnimatedNode rNode = mNativeAnimatedNodesManager.getNodeById(mRNodeId);
    AnimatedNode gNode = mNativeAnimatedNodesManager.getNodeById(mGNodeId);
    AnimatedNode bNode = mNativeAnimatedNodesManager.getNodeById(mBNodeId);
    AnimatedNode aNode = mNativeAnimatedNodesManager.getNodeById(mANodeId);

    double r = ((ValueAnimatedNode) rNode).getValue();
    double g = ((ValueAnimatedNode) gNode).getValue();
    double b = ((ValueAnimatedNode) bNode).getValue();
    double a = ((ValueAnimatedNode) aNode).getValue();

    mColor = ColorUtil.normalize(r, g, b, a);
  }

  @Override
  public String prettyPrint() {
    return "ColorAnimatedNode["
        + mTag
        + "]: r: "
        + mRNodeId
        + " g: "
        + mGNodeId
        + " b: "
        + mBNodeId
        + " a: "
        + mANodeId;
  }
}
