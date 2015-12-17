/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import com.facebook.react.uimanager.CatalystStylesDiffMap;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.ReactProp;
import com.facebook.react.uimanager.ViewProps;

/**
 * FlatShadowNode is a base class for all shadow node used in FlatUIImplementation. It extends
 * {@link LayoutShadowNode} by adding an ability to prepare DrawCommands off the UI thread.
 */
/* package */ class FlatShadowNode extends LayoutShadowNode {

  /* package */ static final FlatShadowNode[] EMPTY_ARRAY = new FlatShadowNode[0];

  private static final String PROP_DECOMPOSED_MATRIX = "decomposedMatrix";
  private static final String PROP_OPACITY = "opacity";
  private static final String PROP_RENDER_TO_HARDWARE_TEXTURE = "renderToHardwareTextureAndroid";
  private static final String PROP_ACCESSIBILITY_LABEL = "accessibilityLabel";
  private static final String PROP_ACCESSIBILITY_COMPONENT_TYPE = "accessibilityComponentType";
  private static final String PROP_ACCESSIBILITY_LIVE_REGION = "accessibilityLiveRegion";
  private static final String PROP_IMPORTANT_FOR_ACCESSIBILITY = "importantForAccessibility";
  private static final String PROP_TEST_ID = "testID";

  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;
  private AttachDetachListener[] mAttachDetachListeners = AttachDetachListener.EMPTY_ARRAY;
  private NodeRegion[] mNodeRegions = NodeRegion.EMPTY_ARRAY;
  private FlatShadowNode[] mNativeChildren = FlatShadowNode.EMPTY_ARRAY;
  private NodeRegion mNodeRegion = NodeRegion.EMPTY;
  private int mNativeParentTag;
  private int mViewLeft;
  private int mViewTop;
  private int mViewRight;
  private int mViewBottom;
  private boolean mMountsToView;
  private boolean mBackingViewIsCreated;
  private @Nullable DrawBackgroundColor mDrawBackground;

  /* package */ void handleUpdateProperties(CatalystStylesDiffMap styles) {
    if (!mountsToView()) {
      // Make sure we mount this FlatShadowNode to a View if any of these properties are present.
      if (styles.hasKey(PROP_DECOMPOSED_MATRIX) ||
          styles.hasKey(PROP_OPACITY) ||
          styles.hasKey(PROP_RENDER_TO_HARDWARE_TEXTURE) ||
          styles.hasKey(PROP_TEST_ID) ||
          styles.hasKey(PROP_ACCESSIBILITY_LABEL) ||
          styles.hasKey(PROP_ACCESSIBILITY_COMPONENT_TYPE) ||
          styles.hasKey(PROP_ACCESSIBILITY_LIVE_REGION) ||
          styles.hasKey(PROP_IMPORTANT_FOR_ACCESSIBILITY)) {
        forceMountToView();
      }
    }
  }

  /**
   * Collects DrawCommands produced by this FlatShadoNode.
   */
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom) {
    if (mDrawBackground != null) {
      mDrawBackground = (DrawBackgroundColor) mDrawBackground.updateBoundsAndFreeze(
          left,
          top,
          right,
          bottom);
      stateBuilder.addDrawCommand(mDrawBackground);
    }
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  public void setBackgroundColor(int backgroundColor) {
    mDrawBackground = (backgroundColor == 0) ? null : new DrawBackgroundColor(backgroundColor);
    invalidate();
  }

  @Override
  public final int getScreenX() {
    return mViewLeft;
  }

  @Override
  public final int getScreenY() {
    return mViewTop;
  }

  @Override
  public final int getScreenWidth() {
    return mViewRight - mViewLeft;
  }

  @Override
  public final int getScreenHeight() {
    return mViewBottom - mViewTop;
  }

  /**
   * Marks root node as updated to trigger a StateBuilder pass to collect DrawCommands for the node
   * tree. Use it when FlatShadowNode is updated but doesn't require a layout pass (e.g. background
   * color is changed).
   */
  protected final void invalidate() {
    ((FlatRootShadowNode) getRootNode()).markUpdated(true);
  }

  /**
   * Returns an array of DrawCommands to perform during the View's draw pass.
   */
  /* package */ DrawCommand[] getDrawCommands() {
    return mDrawCommands;
  }

  /**
   * Sets an array of DrawCommands to perform during the View's draw pass. StateBuilder uses old
   * draw commands to compare to new draw commands and see if the View neds to be redrawn.
   */
  /* package */ void setDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
  }

  /**
   * Sets an array of AttachDetachListeners to call onAttach/onDetach when they are attached to or
   * detached from a View that this shadow node maps to.
   */
  /* package */ void setAttachDetachListeners(AttachDetachListener[] listeners) {
    mAttachDetachListeners = listeners;
  }

  /**
   * Returns an array of AttachDetachListeners associated with this shadow node.
   */
  /* package */ AttachDetachListener[] getAttachDetachListeners() {
    return mAttachDetachListeners;
  }

  /* package */ final FlatShadowNode[] getNativeChildren() {
    return mNativeChildren;
  }

  /* package */ final void setNativeChildren(FlatShadowNode[] nativeChildren) {
    mNativeChildren = nativeChildren;
  }

  /* package */ final int getNativeParentTag() {
    return mNativeParentTag;
  }

  /* package */ final void setNativeParentTag(int nativeParentTag) {
    mNativeParentTag = nativeParentTag;
  }

  /* package */ final NodeRegion[] getNodeRegions() {
    return mNodeRegions;
  }

  /* package */ final void setNodeRegions(NodeRegion[] nodeRegion) {
    mNodeRegions = nodeRegion;
  }

  /* package */ void updateNodeRegion(float left, float top, float right, float bottom) {
    if (mNodeRegion.mLeft != left || mNodeRegion.mTop != top ||
        mNodeRegion.mRight != right || mNodeRegion.mBottom != bottom) {
      setNodeRegion(new NodeRegion(left, top, right, bottom, getReactTag()));
    }
  }

  protected final void setNodeRegion(NodeRegion nodeRegion) {
    mNodeRegion = nodeRegion;
  }

  /* package */ final NodeRegion getNodeRegion() {
    return mNodeRegion;
  }

  /**
   * Sets boundaries of the View that this node maps to relative to the parent left/top coordinate.
   */
  /* package */ void setViewBounds(int left, int top, int right, int bottom) {
    mViewLeft = left;
    mViewTop = top;
    mViewRight = right;
    mViewBottom = bottom;
  }

  /**
   * Left position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewLeft() {
    return mViewLeft;
  }

  /**
   * Top position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewTop() {
    return mViewTop;
  }

  /**
   * Right position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewRight() {
    return mViewRight;
  }

  /**
   * Bottom position of the View this node maps to relative to the parent View.
   */
  /* package */ int getViewBottom() {
    return mViewBottom;
  }

  /* package */ final void forceMountToView() {
    if (!mMountsToView) {
      mMountsToView = true;
      if (getParent() != null) {
        invalidate();
      }
    }
  }

  /* package */ final boolean mountsToView() {
    return mMountsToView;
  }

  /* package */ final boolean isBackingViewCreated() {
    return mBackingViewIsCreated;
  }

  /* package */ final void signalBackingViewIsCreated() {
    mBackingViewIsCreated = true;
  }
}
