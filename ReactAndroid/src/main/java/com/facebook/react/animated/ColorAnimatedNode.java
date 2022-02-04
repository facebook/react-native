/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import android.graphics.Color;
import com.facebook.react.bridge.ColorPropConverter;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.view.ColorUtil;

/** Animated node that represents a color. */
/*package*/ class ColorAnimatedNode extends AnimatedNode {

  private final NativeAnimatedNodesManager mNativeAnimatedNodesManager;
  private final ReactApplicationContext mReactApplicationContext;
  private final int mRNodeId;
  private final int mGNodeId;
  private final int mBNodeId;
  private final int mANodeId;
  private int mColor;

  public ColorAnimatedNode(
      ReadableMap config,
      NativeAnimatedNodesManager nativeAnimatedNodesManager,
      ReactApplicationContext reactApplicationContext) {
    mNativeAnimatedNodesManager = nativeAnimatedNodesManager;
    mReactApplicationContext = reactApplicationContext;
    mRNodeId = config.getInt("r");
    mGNodeId = config.getInt("g");
    mBNodeId = config.getInt("b");
    mANodeId = config.getInt("a");
    setNativeColor(config.getMap("nativeColor"));
  }

  public int getColor() {
    return mColor;
  }

  @Override
  public void update() {
    ValueAnimatedNode rNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mRNodeId);
    ValueAnimatedNode gNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mGNodeId);
    ValueAnimatedNode bNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mBNodeId);
    ValueAnimatedNode aNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mANodeId);

    double r = rNode.getValue();
    double g = gNode.getValue();
    double b = bNode.getValue();
    double a = aNode.getValue();

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

  private void setNativeColor(ReadableMap nativeColor) {
    if (nativeColor == null) {
      return;
    }

    int color =
        ColorPropConverter.getColor(nativeColor, mReactApplicationContext.getCurrentActivity());

    ValueAnimatedNode rNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mRNodeId);
    ValueAnimatedNode gNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mGNodeId);
    ValueAnimatedNode bNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mBNodeId);
    ValueAnimatedNode aNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mANodeId);

    rNode.mValue = Color.red(color);
    gNode.mValue = Color.green(color);
    bNode.mValue = Color.blue(color);
    aNode.mValue = Color.alpha(color) / 255.0;

    update();
  }
}
