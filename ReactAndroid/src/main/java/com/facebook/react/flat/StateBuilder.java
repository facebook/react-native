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

import java.util.ArrayList;

import com.facebook.csslayout.Spacing;
import com.facebook.react.uimanager.OnLayoutEvent;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * Shadow node hierarchy by itself cannot display UI, it is only a representation of what UI should
 * be from JavaScript perspective. StateBuilder is a helper class that can walk the shadow node tree
 * and collect information that can then be passed to UI thread and applied to a hierarchy of Views
 * that Android finally can display.
 */
/* package */ final class StateBuilder {

  private static final boolean SKIP_UP_TO_DATE_NODES = true;

  private static final int[] EMPTY_INT_ARRAY = new int[0];

  private final FlatUIViewOperationQueue mOperationsQueue;

  private final ElementsList<DrawCommand> mDrawCommands =
      new ElementsList<>(DrawCommand.EMPTY_ARRAY);
  private final ElementsList<AttachDetachListener> mAttachDetachListeners =
      new ElementsList<>(AttachDetachListener.EMPTY_ARRAY);
  private final ElementsList<NodeRegion> mNodeRegions =
      new ElementsList<>(NodeRegion.EMPTY_ARRAY);
  private final ElementsList<FlatShadowNode> mNativeChildren =
      new ElementsList<>(FlatShadowNode.EMPTY_ARRAY);

  private final ArrayList<FlatShadowNode> mViewsToDetachAllChildrenFrom = new ArrayList<>();
  private final ArrayList<FlatShadowNode> mViewsToDetach = new ArrayList<>();
  private final ArrayList<FlatShadowNode> mViewsToDrop = new ArrayList<>();
  private final ArrayList<FlatShadowNode> mViewsToUpdate = new ArrayList<>();
  private final ArrayList<ReactStylesDiffMap> mStylesToUpdate = new ArrayList<>();
  private final ArrayList<OnLayoutEvent> mOnLayoutEvents = new ArrayList<>();
  private final ArrayList<FlatUIViewOperationQueue.UpdateViewBounds> mUpdateViewBoundsOperations =
      new ArrayList<>();

  private @Nullable FlatUIViewOperationQueue.DetachAllChildrenFromViews mDetachAllChildrenFromViews;

  /* package */ StateBuilder(FlatUIViewOperationQueue operationsQueue) {
    mOperationsQueue = operationsQueue;
  }

  /* package */ FlatUIViewOperationQueue getOperationsQueue() {
    return mOperationsQueue;
  }

  void beforeUpdateViewHierarchy() {
    commitViewUpdates();
  }

  /**
   * Given a root of the laid-out shadow node hierarchy, walks the tree and generates an array of
   * DrawCommands that will then mount in UI thread to a root FlatViewGroup so that it can draw.
   */
  /* package */ void applyUpdates(FlatShadowNode node) {
    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();
    float left = node.getLayoutX();
    float top = node.getLayoutY();
    float right = left + width;
    float bottom = top + height;

    collectStateForMountableNode(
        node,
        left,
        top,
        right,
        bottom,
        Float.NEGATIVE_INFINITY,
        Float.NEGATIVE_INFINITY,
        Float.POSITIVE_INFINITY,
        Float.POSITIVE_INFINITY);

    updateViewBounds(node, left, top, right, bottom);
  }

  void afterUpdateViewHierarchy(EventDispatcher eventDispatcher) {
    if (mDetachAllChildrenFromViews != null) {
      int[] viewsToDetachAllChildrenFrom = collectViewTags(mViewsToDetachAllChildrenFrom);
      mViewsToDetachAllChildrenFrom.clear();

      mDetachAllChildrenFromViews.setViewsToDetachAllChildrenFrom(viewsToDetachAllChildrenFrom);
      mDetachAllChildrenFromViews = null;
    }

    for (int i = 0, size = mUpdateViewBoundsOperations.size(); i != size; ++i) {
      mOperationsQueue.enqueueUpdateViewBounds(mUpdateViewBoundsOperations.get(i));
    }
    mUpdateViewBoundsOperations.clear();

    // This could be more efficient if EventDispatcher had a batch mode
    // to avoid multiple synchronized calls.
    for (int i = 0, size = mOnLayoutEvents.size(); i != size; ++i) {
      eventDispatcher.dispatchEvent(mOnLayoutEvents.get(i));
    }
    mOnLayoutEvents.clear();

    if (!mViewsToDrop.isEmpty()) {
      mOperationsQueue.enqueueDropViews(collectViewTags(mViewsToDrop));
      mViewsToDrop.clear();
    }

    mOperationsQueue.enqueueProcessLayoutRequests();
  }

  /* package */ void removeRootView(int rootViewTag) {
    // Don't remove Views that are connected to a View that we are about to remove.
    for (int i = mViewsToDrop.size() - 1; i >= 0; --i) {
      if (mViewsToDrop.get(i).getRootNode().getReactTag() == rootViewTag) {
        mViewsToDrop.remove(i);
      }
    }
  }

  /**
   * Adds a DrawCommand for current mountable node.
   */
  /* package */ void addDrawCommand(AbstractDrawCommand drawCommand) {
    mDrawCommands.add(drawCommand);
  }

  /* package */ void addAttachDetachListener(AttachDetachListener listener) {
    mAttachDetachListeners.add(listener);
  }

  /* package */ void enqueueCreateOrUpdateView(
      FlatShadowNode node,
      @Nullable ReactStylesDiffMap styles) {
    mViewsToUpdate.add(node);
    mStylesToUpdate.add(styles);
  }

  /* package */ void ensureBackingViewIsCreated(FlatShadowNode node) {
    if (node.isBackingViewCreated()) {
      return;
    }

    int tag = node.getReactTag();
    mOperationsQueue.enqueueCreateView(node.getThemedContext(), tag, node.getViewClass(), null);

    node.signalBackingViewIsCreated();
  }

  /* package */ void dropView(FlatShadowNode node) {
    mViewsToDrop.add(node);
  }

  private void commitViewUpdates() {
    for (int i = 0, numViewsToUpdate = mViewsToUpdate.size(); i != numViewsToUpdate; ++i) {
      FlatShadowNode node = mViewsToUpdate.get(i);
      if (node.getParent() == null) {
        // Shadow node is not attached to the hierarchy, which means it is being discarded.
        // No need to create or update view in this case, as the View is already gone as well.
        continue;
      }

      if (node.isBackingViewCreated()) {
        // if the View is already created, make sure propagate new styles.
        mOperationsQueue.enqueueUpdateProperties(
            node.getReactTag(),
            node.getViewClass(),
            mStylesToUpdate.get(i));
      } else {
        mOperationsQueue.enqueueCreateView(
            node.getThemedContext(),
            node.getReactTag(),
            node.getViewClass(),
            mStylesToUpdate.get(i));

        node.signalBackingViewIsCreated();
      }
    }

    mViewsToUpdate.clear();
    mStylesToUpdate.clear();
  }

  private void addNodeRegion(
      FlatShadowNode node,
      float left,
      float top,
      float right,
      float bottom,
      boolean isVirtual) {
    if (left == right || top == bottom) {
      // no point in adding an empty NodeRegion
      return;
    }

    node.updateNodeRegion(left, top, right, bottom, isVirtual);
    mNodeRegions.add(node.getNodeRegion());
  }

  private void addNativeChild(FlatShadowNode nativeChild) {
    mNativeChildren.add(nativeChild);
  }

  /**
   * Updates boundaries of a View that a give nodes maps to.
   */
  private void updateViewBounds(
      FlatShadowNode node,
      float left,
      float top,
      float right,
      float bottom) {
    int viewLeft = Math.round(left);
    int viewTop = Math.round(top);
    int viewRight = Math.round(right);
    int viewBottom = Math.round(bottom);
    if (node.getViewLeft() == viewLeft && node.getViewTop() == viewTop &&
        node.getViewRight() == viewRight && node.getViewBottom() == viewBottom) {
      // nothing changed.
      return;
    }

    // this will optionally measure and layout the View this node maps to.
    node.setViewBounds(viewLeft, viewTop, viewRight, viewBottom);
    int tag = node.getReactTag();

    mUpdateViewBoundsOperations.add(
        mOperationsQueue.createUpdateViewBounds(tag, viewLeft, viewTop, viewRight, viewBottom));
  }

  /**
   * Collects state (DrawCommands) for a given node that will mount to a View.
   * Returns true if this node or any of its descendants that mount to View generated any updates.
   */
  private boolean collectStateForMountableNode(
      FlatShadowNode node,
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom) {
    boolean hasUpdates = node.hasNewLayout();

    boolean expectingUpdate = hasUpdates || node.isUpdated() ||
        node.clipBoundsChanged(clipLeft, clipTop, clipRight, clipBottom);
    if (SKIP_UP_TO_DATE_NODES && !expectingUpdate) {
      return false;
    }

    node.setClipBounds(clipLeft, clipTop, clipRight, clipBottom);

    mDrawCommands.start(node.getDrawCommands());
    mAttachDetachListeners.start(node.getAttachDetachListeners());
    mNodeRegions.start(node.getNodeRegions());
    mNativeChildren.start(node.getNativeChildren());

    boolean isAndroidView = false;
    boolean needsCustomLayoutForChildren = false;
    if (node instanceof AndroidView) {
      AndroidView androidView = (AndroidView) node;
      updateViewPadding(androidView, node.getReactTag());

      isAndroidView = true;
      needsCustomLayoutForChildren = androidView.needsCustomLayoutForChildren();

      // AndroidView might scroll (e.g. ScrollView) so we need to reset clip bounds here
      // Otherwise, we might scroll clipped content. If AndroidView doesn't scroll, this is still
      // harmless, because AndroidView will do its own clipping anyway.
      clipLeft = Float.NEGATIVE_INFINITY;
      clipTop = Float.NEGATIVE_INFINITY;
      clipRight = Float.POSITIVE_INFINITY;
      clipBottom = Float.POSITIVE_INFINITY;
    }

    if (!isAndroidView && node.isVirtualAnchor()) {
      // If RCTText is mounted to View, virtual children will not receive any touch events
      // because they don't get added to nodeRegions, so nodeRegions will be empty and
      // FlatViewGroup.reactTagForTouch() will always return RCTText's id. To fix the issue,
      // manually add nodeRegion so it will have exactly one NodeRegion, and virtual nodes will
      // be able to receive touch events.
      addNodeRegion(node, left, top, right, bottom, true);
    }

    boolean descendantUpdated = collectStateRecursively(
        node,
        left,
        top,
        right,
        bottom,
        clipLeft,
        clipTop,
        clipRight,
        clipBottom,
        isAndroidView,
        needsCustomLayoutForChildren);

    boolean shouldUpdateMountState = false;
    final DrawCommand[] drawCommands = mDrawCommands.finish();
    if (drawCommands != null) {
      shouldUpdateMountState = true;
      node.setDrawCommands(drawCommands);
    }

    final AttachDetachListener[] listeners = mAttachDetachListeners.finish();
    if (listeners != null) {
      shouldUpdateMountState = true;
      node.setAttachDetachListeners(listeners);
    }

    final NodeRegion[] nodeRegions = mNodeRegions.finish();
    if (nodeRegions != null) {
      shouldUpdateMountState = true;
      node.setNodeRegions(nodeRegions);
    } else if (descendantUpdated) {
      // one of the descendant's value for overflows container may have changed, so
      // we still need to update ours.
      node.updateOverflowsContainer();
    }

    if (shouldUpdateMountState) {
      mOperationsQueue.enqueueUpdateMountState(
          node.getReactTag(),
          drawCommands,
          listeners,
          nodeRegions,
          node.getOverflowsContainer());
    }

    if (node.hasUnseenUpdates()) {
      node.onCollectExtraUpdates(mOperationsQueue);
      node.markUpdateSeen();
    }

    final FlatShadowNode[] nativeChildren = mNativeChildren.finish();
    if (nativeChildren != null) {
      updateNativeChildren(node, node.getNativeChildren(), nativeChildren);
    }

    boolean updated = shouldUpdateMountState || nativeChildren != null || descendantUpdated;

    if (!expectingUpdate && updated) {
      throw new RuntimeException("Node " + node.getReactTag() + " updated unexpectedly.");
    }

    return updated;
  }

  private void updateNativeChildren(
      FlatShadowNode node,
      FlatShadowNode[] oldNativeChildren,
      FlatShadowNode[] newNativeChildren) {

    node.setNativeChildren(newNativeChildren);

    if (mDetachAllChildrenFromViews == null) {
      mDetachAllChildrenFromViews = mOperationsQueue.enqueueDetachAllChildrenFromViews();
    }

    if (oldNativeChildren.length != 0) {
      mViewsToDetachAllChildrenFrom.add(node);
    }

    int tag = node.getReactTag();
    int numViewsToAdd = newNativeChildren.length;
    final int[] viewsToAdd;
    if (numViewsToAdd == 0) {
      viewsToAdd = EMPTY_INT_ARRAY;
    } else {
      viewsToAdd = new int[numViewsToAdd];
      int i = 0;
      for (FlatShadowNode child : newNativeChildren) {
        if (child.getNativeParentTag() == tag) {
          viewsToAdd[i] = -child.getReactTag();
        } else {
          viewsToAdd[i] = child.getReactTag();
        }
        // all views we add are first start detached
        child.setNativeParentTag(-1);
        ++i;
      }
    }

    // Populate an array of views to detach.
    // These views still have their native parent set as opposed to being reset to -1
    for (FlatShadowNode child : oldNativeChildren) {
      if (child.getNativeParentTag() == tag) {
        // View is attached to old parent and needs to be removed.
        mViewsToDetach.add(child);
        child.setNativeParentTag(-1);
      }
    }

    final int[] viewsToDetach = collectViewTags(mViewsToDetach);
    mViewsToDetach.clear();

    // restore correct parent tag
    for (FlatShadowNode child : newNativeChildren) {
      child.setNativeParentTag(tag);
    }

    mOperationsQueue.enqueueUpdateViewGroup(tag, viewsToAdd, viewsToDetach);
  }

  /**
   * Recursively walks node tree from a given node and collects DrawCommands.
   */
  private boolean collectStateRecursively(
      FlatShadowNode node,
      float left,
      float top,
      float right,
      float bottom,
      float clipLeft,
      float clipTop,
      float clipRight,
      float clipBottom,
      boolean isAndroidView,
      boolean needsCustomLayoutForChildren) {
    if (node.hasNewLayout()) {
      node.markLayoutSeen();
    }

    float roundedLeft = roundToPixel(left);
    float roundedTop = roundToPixel(top);
    float roundedRight = roundToPixel(right);
    float roundedBottom = roundToPixel(bottom);

    // notify JS about layout event if requested
    if (node.shouldNotifyOnLayout()) {
      OnLayoutEvent layoutEvent = node.obtainLayoutEvent(
          Math.round(node.getLayoutX()),
          Math.round(node.getLayoutY()),
          (int) (roundedRight - roundedLeft),
          (int) (roundedBottom - roundedTop));
      if (layoutEvent != null) {
        mOnLayoutEvents.add(layoutEvent);
      }
    }

    if (node.clipToBounds()) {
      clipLeft = Math.max(left, clipLeft);
      clipTop = Math.max(top, clipTop);
      clipRight = Math.min(right, clipRight);
      clipBottom = Math.min(bottom, clipBottom);
    }

    node.collectState(
        this,
        roundedLeft,
        roundedTop,
        roundedRight,
        roundedBottom,
        roundToPixel(clipLeft),
        roundToPixel(clipTop),
        roundToPixel(clipRight),
        clipBottom);

    boolean updated = false;
    for (int i = 0, childCount = node.getChildCount(); i != childCount; ++i) {
      ReactShadowNode child = node.getChildAt(i);
      if (child.isVirtual()) {
        markLayoutSeenRecursively(child);
        continue;
      }

      updated |= processNodeAndCollectState(
          (FlatShadowNode) child,
          left,
          top,
          clipLeft,
          clipTop,
          clipRight,
          clipBottom,
          isAndroidView,
          needsCustomLayoutForChildren);
    }

    node.resetUpdated();

    return updated;
  }

  private void markLayoutSeenRecursively(ReactShadowNode node) {
    if (node.hasNewLayout()) {
      node.markLayoutSeen();
    }

    for (int i = 0, childCount = node.getChildCount(); i != childCount; ++i) {
      markLayoutSeenRecursively(node.getChildAt(i));
    }
  }

  /**
   * Collects state and updates View boundaries for a given node tree.
   * Returns true if this node or any of its descendants that mount to View generated any updates.
   */
  private boolean processNodeAndCollectState(
      FlatShadowNode node,
      float parentLeft,
      float parentTop,
      float parentClipLeft,
      float parentClipTop,
      float parentClipRight,
      float parentClipBottom,
      boolean parentIsAndroidView,
      boolean needsCustomLayout) {
    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();

    float left = parentLeft + node.getLayoutX();
    float top = parentTop + node.getLayoutY();
    float right = left + width;
    float bottom = top + height;

    boolean mountsToView = node.mountsToView();

    final boolean updated;

    if (!parentIsAndroidView) {
      addNodeRegion(node, left, top, right, bottom, !mountsToView);
    }

    if (mountsToView) {
      ensureBackingViewIsCreated(node);

      addNativeChild(node);
      if (!parentIsAndroidView) {
        mDrawCommands.add(node.collectDrawView(
            parentClipLeft,
            parentClipTop,
            parentClipRight,
            parentClipBottom));
      }

      updated = collectStateForMountableNode(
          node,
          left - left,
          top - top,
          right - left,
          bottom - top,
          parentClipLeft - left,
          parentClipTop - top,
          parentClipRight - left,
          parentClipBottom - top);

      if (!needsCustomLayout) {
        updateViewBounds(node, left, top, right, bottom);
      }
    } else {
      updated = collectStateRecursively(
          node,
          left,
          top,
          right,
          bottom,
          parentClipLeft,
          parentClipTop,
          parentClipRight,
          parentClipBottom,
          false,
          false);
    }

    return updated;
  }

  private void updateViewPadding(AndroidView androidView, int reactTag) {
    if (androidView.isPaddingChanged()) {
      Spacing padding = androidView.getPadding();
      mOperationsQueue.enqueueSetPadding(
          reactTag,
          Math.round(padding.get(Spacing.LEFT)),
          Math.round(padding.get(Spacing.TOP)),
          Math.round(padding.get(Spacing.RIGHT)),
          Math.round(padding.get(Spacing.BOTTOM)));
      androidView.resetPaddingChanged();
    }
  }

  private static int[] collectViewTags(ArrayList<FlatShadowNode> views) {
    int numViews = views.size();
    if (numViews == 0) {
      return EMPTY_INT_ARRAY;
    }

    int[] viewTags = new int[numViews];
    for (int i = 0; i < numViews; ++i) {
      viewTags[i] = views.get(i).getReactTag();
    }

    return viewTags;
  }

  /**
   * This is what Math.round() does, except it returns float.
   */
  private static float roundToPixel(float pos) {
    return (float) Math.floor(pos + 0.5f);
  }
}
