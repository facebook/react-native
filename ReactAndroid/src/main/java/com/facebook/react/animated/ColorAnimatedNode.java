/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
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
  private final ReadableMap mNativeColor;
  private boolean mNativeColorApplied;

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
    mNativeColor = config.getMap("nativeColor");
    tryApplyNativeColor();
  }

  public int getColor() {
    tryApplyNativeColor();

    ValueAnimatedNode rNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mRNodeId);
    ValueAnimatedNode gNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mGNodeId);
    ValueAnimatedNode bNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mBNodeId);
    ValueAnimatedNode aNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mANodeId);

    double r = rNode.getValue();
    double g = gNode.getValue();
    double b = bNode.getValue();
    double a = aNode.getValue();

    return ColorUtil.normalize(r, g, b, a);
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

  private void tryApplyNativeColor() {
    if (mNativeColor == null || mNativeColorApplied) {
      return;
    }

    Context context = getContext();
    if (context == null) {
      return;
    }

    int color = ColorPropConverter.getColor(mNativeColor, context);

    ValueAnimatedNode rNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mRNodeId);
    ValueAnimatedNode gNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mGNodeId);
    ValueAnimatedNode bNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mBNodeId);
    ValueAnimatedNode aNode = (ValueAnimatedNode) mNativeAnimatedNodesManager.getNodeById(mANodeId);

    rNode.mValue = Color.red(color);
    gNode.mValue = Color.green(color);
    bNode.mValue = Color.blue(color);
    aNode.mValue = Color.alpha(color) / 255.0;

    mNativeColorApplied = true;
  }

  private Context getContext() {
    Context context = mReactApplicationContext.getCurrentActivity();
    if (context != null) {
      return context;
    }

    // There are cases where the activity may not exist (such as for VRShell panel apps). In this
    // case we will search for a view associated with a PropsAnimatedNode to get the context.
    return getContextHelper(this);
  }

  private static Context getContextHelper(AnimatedNode node) {
    // Search children depth-first until we get to a PropsAnimatedNode, from which we can
    // get the view and its context
    if (node.mChildren != null) {
      for (AnimatedNode child : node.mChildren) {
        if (child instanceof PropsAnimatedNode) {
          View view = ((PropsAnimatedNode) child).getConnectedView();
          return view != null ? view.getContext() : null;
        } else {
          return getContextHelper(child);
        }
      }
    }
    return null;
  }
}
