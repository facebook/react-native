/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.ArrayList;

import javax.annotation.Nullable;

import com.facebook.react.uimanager.CatalystStylesDiffMap;

/**
 * Shadow node hierarchy by itself cannot display UI, it is only a representation of what UI should
 * be from JavaScript perspective. StateBuilder is a helper class that can walk the shadow node tree
 * and collect information that can then be passed to UI thread and applied to a hierarchy of Views
 * that Android finally can display.
 */
/* package */ final class StateBuilder {

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
  private final ArrayList<FlatShadowNode> mViewsToUpdateBounds = new ArrayList<>();

  private @Nullable FlatUIViewOperationQueue.DetachAllChildrenFromViews mDetachAllChildrenFromViews;

  /* package */ StateBuilder(FlatUIViewOperationQueue operationsQueue) {
    mOperationsQueue = operationsQueue;
  }

  /**
   * Given a root of the laid-out shadow node hierarchy, walks the tree and generates an array of
   * DrawCommands that will then mount in UI thread to a root FlatViewGroup so that it can draw.
   */
  /* package */ void applyUpdates(FlatShadowNode node) {
    int tag = node.getReactTag();

    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();
    collectStateForMountableNode(node, tag, width, height);

    float left = node.getLayoutX();
    float top = node.getLayoutY();
    float right = left + width;
    float bottom = top + height;
    updateNodeRegion(node, tag, left, top, right, bottom);

    mViewsToUpdateBounds.add(node);

    if (mDetachAllChildrenFromViews != null) {
      int[] viewsToDetachAllChildrenFrom = collectViewTags(mViewsToDetachAllChildrenFrom);
      mViewsToDetachAllChildrenFrom.clear();

      mDetachAllChildrenFromViews.setViewsToDetachAllChildrenFrom(viewsToDetachAllChildrenFrom);
      mDetachAllChildrenFromViews = null;
    }

    for (int i = 0, size = mViewsToUpdateBounds.size(); i != size; ++i) {
      updateViewBounds(mViewsToUpdateBounds.get(i));
    }
    mViewsToUpdateBounds.clear();
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

  /* package */ void ensureBackingViewIsCreated(
      FlatShadowNode node,
      int tag,
      @Nullable CatalystStylesDiffMap styles) {
    if (node.isBackingViewCreated()) {
      if (styles != null) {
        // if the View is already created, make sure propagate new styles.
        mOperationsQueue.enqueueUpdateProperties(tag, node.getViewClass(), styles);
      }
      return;
    }

    mOperationsQueue.enqueueCreateView(node.getThemedContext(), tag, node.getViewClass(), styles);
    node.signalBackingViewIsCreated();
  }

  private void addNodeRegion(NodeRegion nodeRegion) {
    mNodeRegions.add(nodeRegion);
  }

  private void addNativeChild(FlatShadowNode nativeChild) {
    mNativeChildren.add(nativeChild);
  }

  /**
   * Updates boundaries of a View that a give nodes maps to.
   */
  private void updateViewBounds(FlatShadowNode node) {
    NodeRegion nodeRegion = node.getNodeRegion();

    int viewLeft = Math.round(nodeRegion.mLeft);
    int viewTop = Math.round(nodeRegion.mTop);
    int viewRight = Math.round(nodeRegion.mRight);
    int viewBottom = Math.round(nodeRegion.mBottom);
    if (node.getViewLeft() == viewLeft && node.getViewTop() == viewTop &&
        node.getViewRight() == viewRight && node.getViewBottom() == viewBottom) {
      // nothing changed.
      return;
    }

    // this will optionally measure and layout the View this node maps to.
    node.setViewBounds(viewLeft, viewTop, viewRight, viewBottom);
    int tag = node.getReactTag();
    mOperationsQueue.enqueueUpdateViewBounds(tag, viewLeft, viewTop, viewRight, viewBottom);
  }

  /**
   * Collects state (DrawCommands) for a given node that will mount to a View.
   */
  private void collectStateForMountableNode(
      FlatShadowNode node,
      int tag,
      float width,
      float height) {
    mDrawCommands.start(node.getDrawCommands());
    mAttachDetachListeners.start(node.getAttachDetachListeners());
    mNodeRegions.start(node.getNodeRegions());
    mNativeChildren.start(node.getNativeChildren());

    boolean isAndroidView = false;
    boolean needsCustomLayoutForChildren = false;
    if (node instanceof AndroidView) {
      isAndroidView = true;
      needsCustomLayoutForChildren = ((AndroidView) node).needsCustomLayoutForChildren();
    }

    collectStateRecursively(node, 0, 0, width, height, isAndroidView, needsCustomLayoutForChildren);

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
    }

    if (shouldUpdateMountState) {
      mOperationsQueue.enqueueUpdateMountState(
          tag,
          drawCommands,
          listeners,
          nodeRegions);
    }

    final FlatShadowNode[] nativeChildren = mNativeChildren.finish();
    if (nativeChildren != null) {
      updateNativeChildren(node, tag, node.getNativeChildren(), nativeChildren);
    }
  }

  private void updateNativeChildren(
      FlatShadowNode node,
      int tag,
      FlatShadowNode[] oldNativeChildren,
      FlatShadowNode[] newNativeChildren) {

    node.setNativeChildren(newNativeChildren);

    if (mDetachAllChildrenFromViews == null) {
      mDetachAllChildrenFromViews = mOperationsQueue.enqueueDetachAllChildrenFromViews();
    }

    if (oldNativeChildren.length != 0) {
      mViewsToDetachAllChildrenFrom.add(node);
    }

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
  private void collectStateRecursively(
      FlatShadowNode node,
      float left,
      float top,
      float right,
      float bottom,
      boolean isAndroidView,
      boolean needsCustomLayoutForChildren) {
    if (node.hasNewLayout()) {
      node.markLayoutSeen();
    }

    node.collectState(this, left, top, right, bottom);

    for (int i = 0, childCount = node.getChildCount(); i != childCount; ++i) {
      FlatShadowNode child = (FlatShadowNode) node.getChildAt(i);
      processNodeAndCollectState(child, left, top, isAndroidView, needsCustomLayoutForChildren);
    }
  }

  /**
   * Collects state and updates View boundaries for a given node tree.
   */
  private void processNodeAndCollectState(
      FlatShadowNode node,
      float parentLeft,
      float parentTop,
      boolean parentIsAndroidView,
      boolean needsCustomLayout) {
    int tag = node.getReactTag();

    float width = node.getLayoutWidth();
    float height = node.getLayoutHeight();

    float left = parentLeft + node.getLayoutX();
    float top = parentTop + node.getLayoutY();
    float right = left + width;
    float bottom = top + height;

    updateNodeRegion(node, tag, left, top, right, bottom);

    if (node.mountsToView()) {
      ensureBackingViewIsCreated(node, tag, null);

      addNativeChild(node);
      if (!parentIsAndroidView) {
        mDrawCommands.add(DrawView.INSTANCE);
      }

      collectStateForMountableNode(node, tag, width, height);

      if (!needsCustomLayout) {
        mViewsToUpdateBounds.add(node);
      }
    } else {
      collectStateRecursively(node, left, top, right, bottom, false, false);
      addNodeRegion(node.getNodeRegion());
    }
  }

  private static void updateNodeRegion(
      FlatShadowNode node,
      int tag,
      float left,
      float top,
      float right,
      float bottom) {
    final NodeRegion nodeRegion = node.getNodeRegion();
    if (nodeRegion.mLeft != left || nodeRegion.mTop != top ||
        nodeRegion.mRight != right || nodeRegion.mBottom != bottom) {
      node.setNodeRegion(new NodeRegion(left, top, right, bottom, tag));
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
}
