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

import android.graphics.Rect;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.LayoutShadowNode;
import com.facebook.react.uimanager.OnLayoutEvent;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ViewProps;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ReactClippingViewGroupHelper;

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
  private static final String PROP_TRANSFORM = "transform";
  protected static final String PROP_REMOVE_CLIPPED_SUBVIEWS =
      ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS;
  protected static final String PROP_HORIZONTAL = "horizontal";
  private static final Rect LOGICAL_OFFSET_EMPTY = new Rect();
  // When we first initialize a backing view, we create a view we are going to throw away anyway,
  // so instead initialize with a shared view.
  private static final DrawView EMPTY_DRAW_VIEW = new DrawView(0);

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
  private boolean mBackingViewIsCreated;
  private @Nullable DrawView mDrawView;
  private @Nullable DrawBackgroundColor mDrawBackground;
  private boolean mIsUpdated = true;
  private boolean mForceMountChildrenToView;
  private float mClipLeft;
  private float mClipTop;
  private float mClipRight;
  private float mClipBottom;

  // Used to track whether any of the NodeRegions overflow this Node. This is used to determine
  // whether or not we can detach this Node in the context of a container with
  // setRemoveClippedSubviews enabled.
  private boolean mOverflowsContainer;
  // this Rect contains the offset to get the "logical bounds" (i.e. bounds that include taking
  // into account overflow visible).
  private Rect mLogicalOffset = LOGICAL_OFFSET_EMPTY;

  // last OnLayoutEvent info, only used when shouldNotifyOnLayout() is true.
  private int mLayoutX;
  private int mLayoutY;
  private int mLayoutWidth;
  private int mLayoutHeight;

  // clip radius
  float mClipRadius;
  boolean mClipToBounds = false;

  /* package */ void handleUpdateProperties(ReactStylesDiffMap styles) {
    if (!mountsToView()) {
      // Make sure we mount this FlatShadowNode to a View if any of these properties are present.
      if (styles.hasKey(PROP_DECOMPOSED_MATRIX) ||
          styles.hasKey(PROP_OPACITY) ||
          styles.hasKey(PROP_RENDER_TO_HARDWARE_TEXTURE) ||
          styles.hasKey(PROP_TEST_ID) ||
          styles.hasKey(PROP_ACCESSIBILITY_LABEL) ||
          styles.hasKey(PROP_ACCESSIBILITY_COMPONENT_TYPE) ||
          styles.hasKey(PROP_ACCESSIBILITY_LIVE_REGION) ||
          styles.hasKey(PROP_TRANSFORM) ||
          styles.hasKey(PROP_IMPORTANT_FOR_ACCESSIBILITY) ||
          styles.hasKey(PROP_REMOVE_CLIPPED_SUBVIEWS)) {
        forceMountToView();
      }
    }
  }

  /* package */ final void forceMountChildrenToView() {
    if (mForceMountChildrenToView) {
      return;
    }

    mForceMountChildrenToView = true;
    for (int i = 0, childCount = getChildCount(); i != childCount; ++i) {
      ReactShadowNode child = getChildAt(i);
      if (child instanceof FlatShadowNode) {
        ((FlatShadowNode) child).forceMountToView();
      }
    }
  }

  /**
   * Collects DrawCommands produced by this FlatShadowNode.
   */
  protected void collectState(
      StateBuilder stateBuilder,
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    if (mDrawBackground != null) {
      mDrawBackground = (DrawBackgroundColor) mDrawBackground.updateBoundsAndFreeze(
          left,
          top,
          right,
          bottom,
          clipLeft,
          clipTop,
          clipRight,
          clipBottom);
      stateBuilder.addDrawCommand(mDrawBackground);
    }
  }

  /**
   * Return whether or not this node draws anything
   *
   * This is used to decide whether or not to collect the NodeRegion for this node. This ensures
   * that any FlatShadowNode that does not emit any DrawCommands should not bother handling touch
   * (i.e. if it draws absolutely nothing, it is, for all intents and purposes, a layout only node).
   *
   * @return whether or not this is node draws anything
   */
  boolean doesDraw() {
    // if it mounts to view or draws a background, we can collect it - otherwise, no, unless a
    // child suggests some alternative behavior
    return mDrawView != null || mDrawBackground != null;
  }

  @ReactProp(name = ViewProps.BACKGROUND_COLOR)
  public void setBackgroundColor(int backgroundColor) {
    mDrawBackground = (backgroundColor == 0) ? null : new DrawBackgroundColor(backgroundColor);
    invalidate();
  }

  @Override
  public void setOverflow(String overflow) {
    super.setOverflow(overflow);
    mClipToBounds = "hidden".equals(overflow);
    if (mClipToBounds) {
      mOverflowsContainer = false;
      if (mClipRadius > DrawView.MINIMUM_ROUNDED_CLIPPING_VALUE) {
        // mount to a view if we are overflow: hidden and are clipping, so that we can do one
        // clipPath to clip all the children of this node (both DrawCommands and Views).
        forceMountToView();
      }
    } else {
      updateOverflowsContainer();
    }
    invalidate();
  }

  public final boolean clipToBounds() {
    return mClipToBounds;
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
    if (mountsToView()) {
      return mViewRight - mViewLeft;
    } else {
      return Math.round(mNodeRegion.getRight() - mNodeRegion.getLeft());
    }
  }

  @Override
  public final int getScreenHeight() {
    if (mountsToView()) {
      return mViewBottom - mViewTop;
    } else {
      return Math.round(mNodeRegion.getBottom() - mNodeRegion.getTop());
    }
  }

  @Override
  public void addChildAt(ReactShadowNode child, int i) {
    super.addChildAt(child, i);
    if (mForceMountChildrenToView && child instanceof FlatShadowNode) {
      ((FlatShadowNode) child).forceMountToView();
    }
  }

  /**
   * Marks root node as updated to trigger a StateBuilder pass to collect DrawCommands for the node
   * tree. Use it when FlatShadowNode is updated but doesn't require a layout pass (e.g. background
   * color is changed).
   */
  protected final void invalidate() {
    FlatShadowNode node = this;

    while (true) {
      if (node.mountsToView()) {
        if (node.mIsUpdated) {
          // already updated
          return;
        }

        node.mIsUpdated = true;
      }

      ReactShadowNode parent = node.getParent();
      if (parent == null) {
        // not attached to a hierarchy yet
        return;
      }

      node = (FlatShadowNode) parent;
    }
  }

  @Override
  public void markUpdated() {
    super.markUpdated();
    mIsUpdated = true;
    invalidate();
  }

  /* package */ final boolean isUpdated() {
    return mIsUpdated;
  }

  /* package */ final void resetUpdated() {
    mIsUpdated = false;
  }

  /* package */ final boolean clipBoundsChanged(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    return mClipLeft != clipLeft || mClipTop != clipTop ||
        mClipRight != clipRight || mClipBottom != clipBottom;
  }

  /* package */ final void setClipBounds(
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    mClipLeft = clipLeft;
    mClipTop = clipTop;
    mClipRight = clipRight;
    mClipBottom = clipBottom;
  }

  /**
   * Returns an array of DrawCommands to perform during the View's draw pass.
   */
  /* package */ final DrawCommand[] getDrawCommands() {
    return mDrawCommands;
  }

  /**
   * Sets an array of DrawCommands to perform during the View's draw pass. StateBuilder uses old
   * draw commands to compare to new draw commands and see if the View needs to be redrawn.
   */
  /* package */ final void setDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
  }

  /**
   * Sets an array of AttachDetachListeners to call onAttach/onDetach when they are attached to or
   * detached from a View that this shadow node maps to.
   */
  /* package */ final void setAttachDetachListeners(AttachDetachListener[] listeners) {
    mAttachDetachListeners = listeners;
  }

  /**
   * Returns an array of AttachDetachListeners associated with this shadow node.
   */
  /* package */ final AttachDetachListener[] getAttachDetachListeners() {
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
    updateOverflowsContainer();
  }

  /* package */ final void updateOverflowsContainer() {
    boolean overflowsContainer = false;
    int width = (int) (mNodeRegion.getRight() - mNodeRegion.getLeft());
    int height = (int) (mNodeRegion.getBottom() - mNodeRegion.getTop());

    float leftBound = 0;
    float rightBound = width;
    float topBound = 0;
    float bottomBound = height;
    Rect logicalOffset = null;

    // when we are overflow:visible, we try to figure out if any of the children are outside
    // of the bounds of this view. since NodeRegion bounds are relative to their parent (i.e.
    // 0, 0 is always the start), we see how much outside of the bounds we are (negative left
    // or top, or bottom that's more than height or right that's more than width). we set these
    // offsets in mLogicalOffset for being able to more intelligently determine whether or not
    // to clip certain subviews.
    if (!mClipToBounds && height > 0 && width > 0) {
      for (NodeRegion region : mNodeRegions) {
        if (region.getLeft() < leftBound) {
          leftBound = region.getLeft();
          overflowsContainer = true;
        }

        if (region.getRight() > rightBound) {
          rightBound = region.getRight();
          overflowsContainer = true;
        }

        if (region.getTop() < topBound) {
          topBound = region.getTop();
          overflowsContainer = true;
        }

        if (region.getBottom() > bottomBound) {
          bottomBound = region.getBottom();
          overflowsContainer = true;
        }
      }

      if (overflowsContainer) {
        logicalOffset = new Rect(
            (int) leftBound,
            (int) topBound,
            (int) (rightBound - width),
            (int) (bottomBound - height));
      }
    }

    // if we don't overflow, let's check if any of the immediate children overflow.
    // this is "indirectly recursive," since this method is called when setNodeRegions is called,
    // and the children call setNodeRegions before their parent. consequently, when a node deep
    // inside the tree overflows, its immediate parent has mOverflowsContainer set to true, and,
    // by extension, so do all of its ancestors, sufficing here to only check the immediate
    // child's mOverflowsContainer value instead of recursively asking if each child overflows its
    // container.
    if (!overflowsContainer && mNodeRegion != NodeRegion.EMPTY) {
      int children = getChildCount();
      for (int i = 0; i < children; i++) {
        ReactShadowNode node = getChildAt(i);
        if (node instanceof FlatShadowNode && ((FlatShadowNode) node).mOverflowsContainer) {
          Rect childLogicalOffset = ((FlatShadowNode) node).mLogicalOffset;
          if (logicalOffset == null) {
            logicalOffset = new Rect();
          }
          // TODO: t11674025 - improve this - a grandparent may end up having smaller logical
          // bounds than its children (because the grandparent's size may be larger than that of
          // its child, so the grandchild overflows its parent but not its grandparent). currently,
          // if a 100x100 view has a 5x5 view, and inside it has a 10x10 view, the inner most view
          // overflows its parent but not its grandparent - the logical bounds on the grandparent
          // will still be 5x5 (because they're inherited from the child's logical bounds). this
          // has the effect of causing us to clip 5px later than we really have to.
          logicalOffset.union(childLogicalOffset);
          overflowsContainer = true;
        }
      }
    }

    // if things changed, notify the parent(s) about said changes - while in many cases, this will
    // be extra work (since we process this for the parents after the children), in some cases,
    // we may have no new node regions in the parent, but have a new node region in the child, and,
    // as a result, the parent may not get the correct value for overflows container.
    if (mOverflowsContainer != overflowsContainer) {
      mOverflowsContainer = overflowsContainer;
      mLogicalOffset = logicalOffset == null ? LOGICAL_OFFSET_EMPTY : logicalOffset;
    }
  }

  /* package */ void updateNodeRegion(
      float left,
      float top,
      float right,
      float bottom,
      boolean isVirtual) {
    if (!mNodeRegion.matches(left, top, right, bottom, isVirtual)) {
      setNodeRegion(new NodeRegion(left, top, right, bottom, getReactTag(), isVirtual));
    }
  }

  protected final void setNodeRegion(NodeRegion nodeRegion) {
    mNodeRegion = nodeRegion;
    updateOverflowsContainer();
  }

  /* package */ final NodeRegion getNodeRegion() {
    return mNodeRegion;
  }

  /**
   * Sets boundaries of the View that this node maps to relative to the parent left/top coordinate.
   */
  /* package */ final void setViewBounds(int left, int top, int right, int bottom) {
    mViewLeft = left;
    mViewTop = top;
    mViewRight = right;
    mViewBottom = bottom;
  }

  /**
   * Left position of the View this node maps to relative to the parent View.
   */
  /* package */ final int getViewLeft() {
    return mViewLeft;
  }

  /**
   * Top position of the View this node maps to relative to the parent View.
   */
  /* package */ final int getViewTop() {
    return mViewTop;
  }

  /**
   * Right position of the View this node maps to relative to the parent View.
   */
  /* package */ final int getViewRight() {
    return mViewRight;
  }

  /**
   * Bottom position of the View this node maps to relative to the parent View.
   */
  /* package */ final int getViewBottom() {
    return mViewBottom;
  }

  /* package */ final void forceMountToView() {
    if (isVirtual()) {
      return;
    }

    if (mDrawView == null) {
      // Create a new DrawView, but we might not know our react tag yet, so set it to 0 in the
      // meantime.
      mDrawView = EMPTY_DRAW_VIEW;
      invalidate();

      // reset NodeRegion to allow it getting garbage-collected
      mNodeRegion = NodeRegion.EMPTY;
    }
  }

  /* package */ final DrawView collectDrawView(
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    Assertions.assumeNotNull(mDrawView);
    if (mDrawView == EMPTY_DRAW_VIEW) {
      // This is the first time we have collected this DrawView, but we have to create a new
      // DrawView anyway, as reactTag is final, and our DrawView instance is the static copy.
      mDrawView = new DrawView(getReactTag());
    }

    // avoid path clipping if overflow: visible
    float clipRadius = mClipToBounds ? mClipRadius : 0.0f;
    // We have the correct react tag, but we may need a new copy with updated bounds.  If the bounds
    // match or were never set, the same view is returned.
    mDrawView = mDrawView.collectDrawView(
        left,
        top,
        right,
        bottom,
        left + mLogicalOffset.left,
        top + mLogicalOffset.top,
        right + mLogicalOffset.right,
        bottom + mLogicalOffset.bottom,
        clipLeft,
        clipTop,
        clipRight,
        clipBottom,
        clipRadius);
    return mDrawView;
  }

  @Nullable
  /* package */ final OnLayoutEvent obtainLayoutEvent(int x, int y, int width, int height) {
    if (mLayoutX == x && mLayoutY == y && mLayoutWidth == width && mLayoutHeight == height) {
      return null;
    }

    mLayoutX = x;
    mLayoutY = y;
    mLayoutWidth = width;
    mLayoutHeight = height;

    return OnLayoutEvent.obtain(getReactTag(), x, y, width, height);
  }

  /* package */ final boolean mountsToView() {
    return mDrawView != null;
  }

  /* package */ final boolean isBackingViewCreated() {
    return mBackingViewIsCreated;
  }

  /* package */ final void signalBackingViewIsCreated() {
    mBackingViewIsCreated = true;
  }

  public boolean clipsSubviews() {
    return false;
  }

  public boolean isHorizontal() {
    return false;
  }
}
