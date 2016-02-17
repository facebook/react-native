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

import com.facebook.csslayout.CSSNode;
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
public class ReactShadowNode extends CSSNode {

  private int mReactTag;
  private @Nullable String mViewClassName;
  private @Nullable ReactShadowNode mRootNode;
  private @Nullable ThemedReactContext mThemedContext;
  private boolean mShouldNotifyOnLayout;
  private boolean mNodeUpdated = true;

  // layout-only nodes
  private boolean mIsLayoutOnly;
  private int mTotalNativeChildren = 0;
  private @Nullable ReactShadowNode mNativeParent;
  private @Nullable ArrayList<ReactShadowNode> mNativeChildren;
  private float mAbsoluteLeft;
  private float mAbsoluteTop;
  private float mAbsoluteRight;
  private float mAbsoluteBottom;

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
    return mNodeUpdated || hasNewLayout() || isDirty();
  }

  public final void markUpdateSeen() {
    mNodeUpdated = false;
    if (hasNewLayout()) {
      markLayoutSeen();
    }
  }

  protected void markUpdated() {
    if (mNodeUpdated) {
      return;
    }
    mNodeUpdated = true;
    ReactShadowNode parent = getParent();
    if (parent != null) {
      parent.markUpdated();
    }
  }

  @Override
  protected void dirty() {
    if (!isVirtual()) {
      super.dirty();
    }
  }

  @Override
  public void addChildAt(CSSNode child, int i) {
    super.addChildAt(child, i);
    markUpdated();
    ReactShadowNode node = (ReactShadowNode) child;

    int increase = node.mIsLayoutOnly ? node.mTotalNativeChildren : 1;
    mTotalNativeChildren += increase;

    updateNativeChildrenCountInParent(increase);
  }

  @Override
  public ReactShadowNode removeChildAt(int i) {
    ReactShadowNode removed = (ReactShadowNode) super.removeChildAt(i);
    markUpdated();

    int decrease = removed.mIsLayoutOnly ? removed.mTotalNativeChildren : 1;
    mTotalNativeChildren -= decrease;
    updateNativeChildrenCountInParent(-decrease);
    return removed;
  }

  public void removeAllChildren() {
    int decrease = 0;
    for (int i = getChildCount() - 1; i >= 0; i--) {
      ReactShadowNode removed = (ReactShadowNode) super.removeChildAt(i);
      decrease += removed.mIsLayoutOnly ? removed.mTotalNativeChildren : 1;
    }
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

  /* package */ void dispatchUpdates(
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
    }
  }

  public final int getReactTag() {
    return mReactTag;
  }

  /* package */ final void setReactTag(int reactTag) {
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

  @Override
  public final ReactShadowNode getChildAt(int i) {
    return (ReactShadowNode) super.getChildAt(i);
  }

  @Override
  public final @Nullable ReactShadowNode getParent() {
    return (ReactShadowNode) super.getParent();
  }

  /**
   * Get the {@link ThemedReactContext} associated with this {@link ReactShadowNode}. This will
   * never change during the lifetime of a {@link ReactShadowNode} instance, but different instances
   * can have different contexts; don't cache any calculations based on theme values globally.
   */
  public ThemedReactContext getThemedContext() {
    return Assertions.assertNotNull(mThemedContext);
  }

  public void setThemedContext(ThemedReactContext themedContext) {
    mThemedContext = themedContext;
  }

  public void setShouldNotifyOnLayout(boolean shouldNotifyOnLayout) {
    mShouldNotifyOnLayout = shouldNotifyOnLayout;
  }

  public boolean shouldNotifyOnLayout() {
    return mShouldNotifyOnLayout;
  }

  /**
   * Adds a child that the native view hierarchy will have at this index in the native view
   * corresponding to this node.
   */
  public void addNativeChildAt(ReactShadowNode child, int nativeIndex) {
    Assertions.assertCondition(!mIsLayoutOnly);
    Assertions.assertCondition(!child.mIsLayoutOnly);

    if (mNativeChildren == null) {
      mNativeChildren = new ArrayList<>(4);
    }

    mNativeChildren.add(nativeIndex, child);
    child.mNativeParent = this;
  }

  public ReactShadowNode removeNativeChildAt(int i) {
    Assertions.assertNotNull(mNativeChildren);
    ReactShadowNode removed = mNativeChildren.remove(i);
    removed.mNativeParent = null;
    return removed;
  }

  public void removeAllNativeChildren() {
    if (mNativeChildren != null) {
      for (int i = mNativeChildren.size() - 1; i >= 0; i--) {
        mNativeChildren.get(i).mNativeParent = null;
      }
      mNativeChildren.clear();
    }
  }

  public int getNativeChildCount() {
    return mNativeChildren == null ? 0 : mNativeChildren.size();
  }

  public int indexOfNativeChild(ReactShadowNode nativeChild) {
    Assertions.assertNotNull(mNativeChildren);
    return mNativeChildren.indexOf(nativeChild);
  }

  public @Nullable ReactShadowNode getNativeParent() {
    return mNativeParent;
  }

  /**
   * Sets whether this node only contributes to the layout of its children without doing any
   * drawing or functionality itself.
   */
  public void setIsLayoutOnly(boolean isLayoutOnly) {
    Assertions.assertCondition(getParent() == null, "Must remove from no opt parent first");
    Assertions.assertCondition(mNativeParent == null, "Must remove from native parent first");
    Assertions.assertCondition(getNativeChildCount() == 0, "Must remove all native children first");
    mIsLayoutOnly = isLayoutOnly;
  }

  public boolean isLayoutOnly() {
    return mIsLayoutOnly;
  }

  public int getTotalNativeChildren() {
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
  public int getNativeOffsetForChild(ReactShadowNode child) {
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
}
