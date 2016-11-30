/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import java.util.ArrayList;

import com.facebook.csslayout.CSSAlign;
import com.facebook.csslayout.CSSConstants;
import com.facebook.csslayout.CSSDirection;
import com.facebook.csslayout.CSSFlexDirection;
import com.facebook.csslayout.CSSJustify;
import com.facebook.csslayout.CSSLayoutContext;
import com.facebook.csslayout.CSSNode;
import com.facebook.csslayout.CSSNodeAPI;
import com.facebook.csslayout.CSSOverflow;
import com.facebook.csslayout.CSSPositionType;
import com.facebook.csslayout.CSSWrap;
import com.facebook.csslayout.Spacing;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.uimanager.annotations.ReactPropertyHolder;

/**
 * Base node class for representing virtual tree of React nodes. Shadow nodes are used primarily
 * for layouting therefore it extends {@link CSSNode} to allow that. They also help with handling
 * Common base subclass of {@link CSSNode} for all layout nodes for react-based view. It extends
 * {@link CSSNode} by adding additional capabilities.
 *
 * Instances of this class receive property updates from JS via @{link UIManagerModule}. Subclasses
 * may use {@link #updateShadowNode} to persist some of the updated fields in the node instance that
 * corresponds to a particular view type.
 *
 * Subclasses of {@link ReactShadowNode} should be created only from {@link ViewManager} that
 * corresponds to a certain type of native view. They will be updated and accessed only from JS
 * thread. Subclasses of {@link ViewManager} may choose to use base class {@link ReactShadowNode} or
 * custom subclass of it if necessary.
 *
 * The primary use-case for {@link ReactShadowNode} nodes is to calculate layouting. Although this
 * might be extended. For some examples please refer to ARTGroupCSSNode or ReactTextCSSNode.
 *
 * This class allows for the native view hierarchy to not be an exact copy of the hierarchy received
 * from JS by keeping track of both JS children (e.g. {@link #getChildCount()} and separately native
 * children (e.g. {@link #getNativeChildCount()}). See {@link NativeViewHierarchyOptimizer} for more
 * information.
 */
@ReactPropertyHolder
public class ReactShadowNode {

  private int mReactTag;
  private @Nullable String mViewClassName;
  private @Nullable ReactShadowNode mRootNode;
  private @Nullable ThemedReactContext mThemedContext;
  private boolean mShouldNotifyOnLayout;
  private boolean mNodeUpdated = true;
  private @Nullable ArrayList<ReactShadowNode> mChildren;
  private @Nullable ReactShadowNode mParent;

  // layout-only nodes
  private boolean mIsLayoutOnly;
  private int mTotalNativeChildren = 0;
  private @Nullable ReactShadowNode mNativeParent;
  private @Nullable ArrayList<ReactShadowNode> mNativeChildren;
  private float mAbsoluteLeft;
  private float mAbsoluteTop;
  private float mAbsoluteRight;
  private float mAbsoluteBottom;
  private final Spacing mDefaultPadding = new Spacing(0);
  private final Spacing mPadding = new Spacing(CSSConstants.UNDEFINED);
  private final CSSNode mCSSNode;

  public ReactShadowNode() {
    CSSNode node = CSSNodePool.get().acquire();
    if (node == null) {
      node = new CSSNode();
    }
    mCSSNode = node;
  }

  /**
   * Nodes that return {@code true} will be treated as "virtual" nodes. That is, nodes that are not
   * mapped into native views (e.g. nested text node). By default this method returns {@code false}.
   */
  public boolean isVirtual() {
    return false;
  }

  /**
   * Nodes that return {@code true} will be treated as a root view for the virtual nodes tree. It
   * means that {@link NativeViewHierarchyManager} will not try to perform {@code manageChildren}
   * operation on such views. Good example is {@code InputText} view that may have children
   * {@code Text} nodes but this whole hierarchy will be mapped to a single android {@link EditText}
   * view.
   */
  public boolean isVirtualAnchor() {
    return false;
  }

  public final String getViewClass() {
    return Assertions.assertNotNull(mViewClassName);
  }

  public final boolean hasUpdates() {
    return mNodeUpdated || hasNewLayout() || mCSSNode.isDirty();
  }

  public final void markUpdateSeen() {
    mNodeUpdated = false;
    if (hasNewLayout()) {
      markLayoutSeen();
    }
  }

  public void markUpdated() {
    if (mNodeUpdated) {
      return;
    }
    mNodeUpdated = true;
    ReactShadowNode parent = getParent();
    if (parent != null) {
      parent.markUpdated();
    }
  }

  public final boolean hasUnseenUpdates() {
    return mNodeUpdated;
  }

  public void dirty() {
    if (!isVirtual()) {
      mCSSNode.dirty();
    }
  }

  public void addChildAt(ReactShadowNode child, int i) {
    if (child.mParent != null) {
      throw new IllegalViewOperationException(
        "Tried to add child that already has a parent! Remove it from its parent first.");
    }
    if (mChildren == null) {
      mChildren = new ArrayList<ReactShadowNode>(4);
    }
    mChildren.add(i, child);
    child.mParent = this;

    // If a CSS node has measure defined, the layout algorithm will not visit its children. Even
    // more, it asserts that you don't add children to nodes with measure functions.
    if (!mCSSNode.isMeasureDefined()) {
      mCSSNode.addChildAt(child.mCSSNode, i);
    }
    markUpdated();

    int increase = child.mIsLayoutOnly ? child.mTotalNativeChildren : 1;
    mTotalNativeChildren += increase;

    updateNativeChildrenCountInParent(increase);
  }

  public ReactShadowNode removeChildAt(int i) {
    if (mChildren == null) {
      throw new ArrayIndexOutOfBoundsException(
        "Index " + i + " out of bounds: node has no children");
    }
    ReactShadowNode removed = mChildren.remove(i);
    removed.mParent = null;

    if (!mCSSNode.isMeasureDefined()) {
      mCSSNode.removeChildAt(i);
    }
    markUpdated();

    int decrease = removed.mIsLayoutOnly ? removed.mTotalNativeChildren : 1;
    mTotalNativeChildren -= decrease;
    updateNativeChildrenCountInParent(-decrease);
    return removed;
  }

  public final int getChildCount() {
    return mChildren == null ? 0 : mChildren.size();
  }

  public final ReactShadowNode getChildAt(int i) {
    if (mChildren == null) {
      throw new ArrayIndexOutOfBoundsException(
        "Index " + i + " out of bounds: node has no children");
    }
    return mChildren.get(i);
  }

  public final int indexOf(ReactShadowNode child) {
    return mChildren == null ? -1 : mChildren.indexOf(child);
  }

  public void removeAndDisposeAllChildren() {
    if (getChildCount() == 0) {
      return;
    }

    int decrease = 0;
    for (int i = getChildCount() - 1; i >= 0; i--) {
      if (!mCSSNode.isMeasureDefined()) {
        mCSSNode.removeChildAt(i);
      }
      ReactShadowNode toRemove = getChildAt(i);
      toRemove.mParent = null;
      toRemove.dispose();

      decrease += toRemove.mIsLayoutOnly ? toRemove.mTotalNativeChildren : 1;
    }
    Assertions.assertNotNull(mChildren).clear();
    markUpdated();

    mTotalNativeChildren -= decrease;
    updateNativeChildrenCountInParent(-decrease);
  }

  private void updateNativeChildrenCountInParent(int delta) {
    if (mIsLayoutOnly) {
      ReactShadowNode parent = getParent();
      while (parent != null) {
        parent.mTotalNativeChildren += delta;
        if (!parent.mIsLayoutOnly) {
          break;
        }
        parent = parent.getParent();
      }
    }
  }

  /**
   * This method will be called by {@link UIManagerModule} once per batch, before calculating
   * layout. Will be only called for nodes that are marked as updated with {@link #markUpdated()}
   * or require layouting (marked with {@link #dirty()}).
   */
  public void onBeforeLayout() {
  }

  public final void updateProperties(ReactStylesDiffMap props) {
    ViewManagerPropertyUpdater.updateProps(this, props);
    onAfterUpdateTransaction();
  }

  public void onAfterUpdateTransaction() {
    // no-op
  }

  /**
   * Called after layout step at the end of the UI batch from {@link UIManagerModule}. May be used
   * to enqueue additional ui operations for the native view. Will only be called on nodes marked
   * as updated either with {@link #dirty()} or {@link #markUpdated()}.
   *
   * @param uiViewOperationQueue interface for enqueueing UI operations
   */
  public void onCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue) {
  }

  /**
   * @return true if layout (position or dimensions) changed, false otherwise.
   */
  /* package */ boolean dispatchUpdates(
      float absoluteX,
      float absoluteY,
      UIViewOperationQueue uiViewOperationQueue,
      NativeViewHierarchyOptimizer nativeViewHierarchyOptimizer) {
    if (mNodeUpdated) {
      onCollectExtraUpdates(uiViewOperationQueue);
    }

    if (hasNewLayout()) {
      mAbsoluteLeft = Math.round(absoluteX + getLayoutX());
      mAbsoluteTop = Math.round(absoluteY + getLayoutY());
      mAbsoluteRight = Math.round(absoluteX + getLayoutX() + getLayoutWidth());
      mAbsoluteBottom = Math.round(absoluteY + getLayoutY() + getLayoutHeight());
      nativeViewHierarchyOptimizer.handleUpdateLayout(this);
      return true;
    } else {
      return false;
    }
  }

  public final int getReactTag() {
    return mReactTag;
  }

  public void setReactTag(int reactTag) {
    mReactTag = reactTag;
  }

  public final ReactShadowNode getRootNode() {
    return Assertions.assertNotNull(mRootNode);
  }

  /* package */ final void setRootNode(ReactShadowNode rootNode) {
    mRootNode = rootNode;
  }

  /* package */ final void setViewClassName(String viewClassName) {
    mViewClassName = viewClassName;
  }

  public final @Nullable ReactShadowNode getParent() {
    return mParent;
  }

  /**
   * Get the {@link ThemedReactContext} associated with this {@link ReactShadowNode}. This will
   * never change during the lifetime of a {@link ReactShadowNode} instance, but different instances
   * can have different contexts; don't cache any calculations based on theme values globally.
   */
  public final ThemedReactContext getThemedContext() {
    return Assertions.assertNotNull(mThemedContext);
  }

  public void setThemedContext(ThemedReactContext themedContext) {
    mThemedContext = themedContext;
  }

  public final boolean shouldNotifyOnLayout() {
    return mShouldNotifyOnLayout;
  }

  public void calculateLayout(CSSLayoutContext layoutContext) {
    mCSSNode.calculateLayout(layoutContext);
  }

  public final boolean hasNewLayout() {
    return mCSSNode.hasNewLayout();
  }

  public final void markLayoutSeen() {
    mCSSNode.markLayoutSeen();
  }

  /**
   * Adds a child that the native view hierarchy will have at this index in the native view
   * corresponding to this node.
   */
  public final void addNativeChildAt(ReactShadowNode child, int nativeIndex) {
    Assertions.assertCondition(!mIsLayoutOnly);
    Assertions.assertCondition(!child.mIsLayoutOnly);

    if (mNativeChildren == null) {
      mNativeChildren = new ArrayList<>(4);
    }

    mNativeChildren.add(nativeIndex, child);
    child.mNativeParent = this;
  }

  public final ReactShadowNode removeNativeChildAt(int i) {
    Assertions.assertNotNull(mNativeChildren);
    ReactShadowNode removed = mNativeChildren.remove(i);
    removed.mNativeParent = null;
    return removed;
  }

  public final void removeAllNativeChildren() {
    if (mNativeChildren != null) {
      for (int i = mNativeChildren.size() - 1; i >= 0; i--) {
        mNativeChildren.get(i).mNativeParent = null;
      }
      mNativeChildren.clear();
    }
  }

  public final int getNativeChildCount() {
    return mNativeChildren == null ? 0 : mNativeChildren.size();
  }

  public final int indexOfNativeChild(ReactShadowNode nativeChild) {
    Assertions.assertNotNull(mNativeChildren);
    return mNativeChildren.indexOf(nativeChild);
  }

  public final @Nullable ReactShadowNode getNativeParent() {
    return mNativeParent;
  }

  /**
   * Sets whether this node only contributes to the layout of its children without doing any
   * drawing or functionality itself.
   */
  public final void setIsLayoutOnly(boolean isLayoutOnly) {
    Assertions.assertCondition(getParent() == null, "Must remove from no opt parent first");
    Assertions.assertCondition(mNativeParent == null, "Must remove from native parent first");
    Assertions.assertCondition(getNativeChildCount() == 0, "Must remove all native children first");
    mIsLayoutOnly = isLayoutOnly;
  }

  public final boolean isLayoutOnly() {
    return mIsLayoutOnly;
  }

  public final int getTotalNativeChildren() {
    return mTotalNativeChildren;
  }

  /**
   * Returns the offset within the native children owned by all layout-only nodes in the subtree
   * rooted at this node for the given child. Put another way, this returns the number of native
   * nodes (nodes not optimized out of the native tree) that are a) to the left (visited before by a
   * DFS) of the given child in the subtree rooted at this node and b) do not have a native parent
   * in this subtree (which means that the given child will be a sibling of theirs in the final
   * native hierarchy since they'll get attached to the same native parent).
   *
   * Basically, a view might have children that have been optimized away by
   * {@link NativeViewHierarchyOptimizer}. Since those children will then add their native children
   * to this view, we now have ranges of native children that correspond to single unoptimized
   * children. The purpose of this method is to return the index within the native children that
   * corresponds to the **start** of the native children that belong to the given child. Also, note
   * that all of the children of a view might be optimized away, so this could return the same value
   * for multiple different children.
   *
   * Example. Native children are represented by (N) where N is the no-opt child they came from. If
   * no children are optimized away it'd look like this: (0) (1) (2) (3) ... (n)
   *
   * In case some children are optimized away, it might look like this:
   * (0) (1) (1) (1) (3) (3) (4)
   *
   * In that case:
   * getNativeOffsetForChild(Node 0) => 0
   * getNativeOffsetForChild(Node 1) => 1
   * getNativeOffsetForChild(Node 2) => 4
   * getNativeOffsetForChild(Node 3) => 4
   * getNativeOffsetForChild(Node 4) => 6
   */
  public final int getNativeOffsetForChild(ReactShadowNode child) {
    int index = 0;
    boolean found = false;
    for (int i = 0; i < getChildCount(); i++) {
      ReactShadowNode current = getChildAt(i);
      if (child == current) {
        found = true;
        break;
      }
      index += (current.mIsLayoutOnly ? current.getTotalNativeChildren() : 1);
    }
    if (!found) {
      throw new RuntimeException("Child " + child.mReactTag + " was not a child of " + mReactTag);
    }
    return index;
  }

  public final float getLayoutX() {
    return mCSSNode.getLayoutX();
  }

  public final float getLayoutY() {
    return mCSSNode.getLayoutY();
  }

  public final float getLayoutWidth() {
    return mCSSNode.getLayoutWidth();
  }

  public final float getLayoutHeight() {
    return mCSSNode.getLayoutHeight();
  }

  /**
   * @return the x position of the corresponding view on the screen, rounded to pixels
   */
  public int getScreenX() {
    return Math.round(getLayoutX());
  }

  /**
   * @return the y position of the corresponding view on the screen, rounded to pixels
   */
  public int getScreenY() {
    return Math.round(getLayoutY());
  }

  /**
   * @return width corrected for rounding to pixels.
   */
  public int getScreenWidth() {
    return Math.round(mAbsoluteRight - mAbsoluteLeft);
  }

  /**
   * @return height corrected for rounding to pixels.
   */
  public int getScreenHeight() {
    return Math.round(mAbsoluteBottom - mAbsoluteTop);
  }

  public final CSSDirection getLayoutDirection() {
    return mCSSNode.getLayoutDirection();
  }

  public void setLayoutDirection(CSSDirection direction) {
    mCSSNode.setDirection(direction);
  }

  public final float getStyleWidth() {
    return mCSSNode.getStyleWidth();
  }

  public void setStyleWidth(float widthPx) {
    mCSSNode.setStyleWidth(widthPx);
  }

  public void setStyleMinWidth(float widthPx) {
    mCSSNode.setStyleMinWidth(widthPx);
  }

  public void setStyleMaxWidth(float widthPx) {
    mCSSNode.setStyleMaxWidth(widthPx);
  }

  public final float getStyleHeight() {
    return mCSSNode.getStyleHeight();
  }

  public void setStyleHeight(float heightPx) {
    mCSSNode.setStyleHeight(heightPx);
  }

  public void setStyleMinHeight(float widthPx) {
    mCSSNode.setStyleMinHeight(widthPx);
  }

  public void setStyleMaxHeight(float widthPx) {
    mCSSNode.setStyleMaxHeight(widthPx);
  }

  public void setFlex(float flex) {
    mCSSNode.setFlex(flex);
  }

  public void setFlexGrow(float flexGrow) {
    mCSSNode.setFlexGrow(flexGrow);
  }

  public void setFlexShrink(float flexShrink) {
    mCSSNode.setFlexShrink(flexShrink);
  }

  public void setFlexBasis(float flexBasis) {
    mCSSNode.setFlexBasis(flexBasis);
  }

  public void setFlexDirection(CSSFlexDirection flexDirection) {
    mCSSNode.setFlexDirection(flexDirection);
  }

  public void setFlexWrap(CSSWrap wrap) {
    mCSSNode.setWrap(wrap);
  }

  public void setAlignSelf(CSSAlign alignSelf) {
    mCSSNode.setAlignSelf(alignSelf);
  }

  public void setAlignItems(CSSAlign alignItems) {
    mCSSNode.setAlignItems(alignItems);
  }

  public void setJustifyContent(CSSJustify justifyContent) {
    mCSSNode.setJustifyContent(justifyContent);
  }

  public void setOverflow(CSSOverflow overflow) {
    mCSSNode.setOverflow(overflow);
  }

  public void setMargin(int spacingType, float margin) {
    mCSSNode.setMargin(spacingType, margin);
  }

  public final float getPadding(int spacingType) {
    return mCSSNode.getPadding(spacingType);
  }

  public void setDefaultPadding(int spacingType, float padding) {
    mDefaultPadding.set(spacingType, padding);
    updatePadding();
  }

  public void setPadding(int spacingType, float padding) {
    mPadding.set(spacingType, padding);
    updatePadding();
  }

  private void updatePadding() {
    for (int spacingType = Spacing.LEFT; spacingType <= Spacing.ALL; spacingType++) {
      if (spacingType == Spacing.LEFT ||
        spacingType == Spacing.RIGHT ||
        spacingType == Spacing.START ||
        spacingType == Spacing.END) {
        if (CSSConstants.isUndefined(mPadding.getRaw(spacingType)) &&
          CSSConstants.isUndefined(mPadding.getRaw(Spacing.HORIZONTAL)) &&
          CSSConstants.isUndefined(mPadding.getRaw(Spacing.ALL))) {
          mCSSNode.setPadding(spacingType, mDefaultPadding.getRaw(spacingType));
        } else {
          mCSSNode.setPadding(spacingType, mPadding.getRaw(spacingType));
        }
      } else if (spacingType == Spacing.TOP || spacingType == Spacing.BOTTOM) {
        if (CSSConstants.isUndefined(mPadding.getRaw(spacingType)) &&
          CSSConstants.isUndefined(mPadding.getRaw(Spacing.VERTICAL)) &&
          CSSConstants.isUndefined(mPadding.getRaw(Spacing.ALL))) {
          mCSSNode.setPadding(spacingType, mDefaultPadding.getRaw(spacingType));
        } else {
          mCSSNode.setPadding(spacingType, mPadding.getRaw(spacingType));
        }
      } else {
        if (CSSConstants.isUndefined(mPadding.getRaw(spacingType))) {
          mCSSNode.setPadding(spacingType, mDefaultPadding.getRaw(spacingType));
        } else {
          mCSSNode.setPadding(spacingType, mPadding.getRaw(spacingType));
        }
      }
    }
  }

  public void setBorder(int spacingType, float borderWidth) {
    mCSSNode.setBorder(spacingType, borderWidth);
  }

  public void setPosition(int spacingType, float position) {
    mCSSNode.setPosition(spacingType, position);
  }

  public void setPositionType(CSSPositionType positionType) {
    mCSSNode.setPositionType(positionType);
  }

  public void setShouldNotifyOnLayout(boolean shouldNotifyOnLayout) {
    mShouldNotifyOnLayout = shouldNotifyOnLayout;
  }

  public void setMeasureFunction(CSSNodeAPI.MeasureFunction measureFunction) {
    if ((measureFunction == null ^ mCSSNode.isMeasureDefined()) &&
        getChildCount() != 0) {
      throw new RuntimeException(
        "Since a node with a measure function does not add any native CSSLayout children, it's " +
          "not safe to transition to/from having a measure function unless a node has no children");
    }
    mCSSNode.setMeasureFunction(measureFunction);
  }

  @Override
  public String toString() {
    return mCSSNode.toString();
  }

  public void dispose() {
    mCSSNode.reset();
    CSSNodePool.get().release(mCSSNode);
  }
}
