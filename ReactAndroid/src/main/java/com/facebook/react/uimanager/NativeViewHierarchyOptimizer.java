/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.util.SparseBooleanArray;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import javax.annotation.Nullable;

/**
 * Class responsible for optimizing the native view hierarchy while still respecting the final UI
 * product specified by JS. Basically, JS sends us a hierarchy of nodes that, while easy to reason
 * about in JS, are very inefficient to translate directly to native views. This class sits in
 * between {@link UIManagerModule}, which directly receives view commands from JS, and
 * {@link UIViewOperationQueue}, which enqueues actual operations on the native view hierarchy. It
 * is able to take instructions from UIManagerModule and output instructions to the native view
 * hierarchy that achieve the same displayed UI but with fewer views.
 *
 * Currently this class is only used to remove layout-only views, that is to say views that only
 * affect the positions of their children but do not draw anything themselves. These views are
 * fairly common because 1) containers are used to do layouting via flexbox and 2) the return of
 * each Component#render() call in JS must be exactly one view, which means views are often wrapped
 * in a unnecessary layer of hierarchy.
 *
 * This optimization is implemented by keeping track of both the unoptimized JS hierarchy and the
 * optimized native hierarchy in {@link ReactShadowNode}.
 *
 * This optimization is important for view hierarchy depth (which can cause stack overflows during
 * view traversal for complex apps), memory usage, amount of time spent during GCs,
 * and time-to-display.
 *
 * Some examples of the optimizations this class will do based on commands from JS:
 * - Create a view with only layout props: a description of that view is created as a
 *   {@link ReactShadowNode} in UIManagerModule, but this class will not output any commands to
 *   create the view in the native view hierarchy.
 * - Update a layout-only view to have non-layout props: before issuing the updateShadowNode call
 *   to the native view hierarchy, issue commands to create the view we optimized away move it into
 *   the view hierarchy
 * - Manage the children of a view: multiple manageChildren calls for various parent views may be
 *   issued to the native view hierarchy depending on where the views being added/removed are
 *   attached in the optimized hierarchy
 */
public class NativeViewHierarchyOptimizer {

  private static class NodeIndexPair {
    public final ReactShadowNode node;
    public final int index;

    NodeIndexPair(ReactShadowNode node, int index) {
      this.node = node;
      this.index = index;
    }
  }

  private static final boolean ENABLED = true;

  private final UIViewOperationQueue mUIViewOperationQueue;
  private final ShadowNodeRegistry mShadowNodeRegistry;
  private final SparseBooleanArray mTagsWithLayoutVisited = new SparseBooleanArray();

  public NativeViewHierarchyOptimizer(
      UIViewOperationQueue uiViewOperationQueue,
      ShadowNodeRegistry shadowNodeRegistry) {
    mUIViewOperationQueue = uiViewOperationQueue;
    mShadowNodeRegistry = shadowNodeRegistry;
  }

  /**
   * Handles a createView call. May or may not actually create a native view.
   */
  public void handleCreateView(
      ReactShadowNode node,
      ThemedReactContext themedContext,
      @Nullable ReactStylesDiffMap initialProps) {
    if (!ENABLED) {
      int tag = node.getReactTag();
      mUIViewOperationQueue.enqueueCreateView(
          themedContext,
          tag,
          node.getViewClass(),
          initialProps);
      return;
    }

    boolean isLayoutOnly = node.getViewClass().equals(ViewProps.VIEW_CLASS_NAME) &&
        isLayoutOnlyAndCollapsable(initialProps);
    node.setIsLayoutOnly(isLayoutOnly);

    if (!isLayoutOnly) {
      mUIViewOperationQueue.enqueueCreateView(
          themedContext,
          node.getReactTag(),
          node.getViewClass(),
          initialProps);
    }
  }

  /**
   * Handles native children cleanup when css node is removed from hierarchy
   */
  public static void handleRemoveNode(ReactShadowNode node) {
    node.removeAllNativeChildren();
  }

  /**
   * Handles an updateView call. If a view transitions from being layout-only to not (or vice-versa)
   * this could result in some number of additional createView and manageChildren calls. If the
   * view is layout only, no updateView call will be dispatched to the native hierarchy.
   */
  public void handleUpdateView(
      ReactShadowNode node,
      String className,
      ReactStylesDiffMap props) {
    if (!ENABLED) {
      mUIViewOperationQueue.enqueueUpdateProperties(node.getReactTag(), className, props);
      return;
    }

    boolean needsToLeaveLayoutOnly = node.isLayoutOnly() && !isLayoutOnlyAndCollapsable(props);
    if (needsToLeaveLayoutOnly) {
      transitionLayoutOnlyViewToNativeView(node, props);
    } else if (!node.isLayoutOnly()) {
      mUIViewOperationQueue.enqueueUpdateProperties(node.getReactTag(), className, props);
    }
  }

  /**
   * Handles a manageChildren call. This may translate into multiple manageChildren calls for
   * multiple other views.
   *
   * NB: the assumption for calling this method is that all corresponding ReactShadowNodes have
   * been updated **but tagsToDelete have NOT been deleted yet**. This is because we need to use
   * the metadata from those nodes to figure out the correct commands to dispatch. This is unlike
   * all other calls on this class where we assume all operations on the shadow hierarchy have
   * already completed by the time a corresponding method here is called.
   */
  public void handleManageChildren(
      ReactShadowNode nodeToManage,
      int[] indicesToRemove,
      int[] tagsToRemove,
      ViewAtIndex[] viewsToAdd,
      int[] tagsToDelete) {
    if (!ENABLED) {
      mUIViewOperationQueue.enqueueManageChildren(
          nodeToManage.getReactTag(),
          indicesToRemove,
          viewsToAdd,
          tagsToDelete);
      return;
    }

    // We operate on tagsToRemove instead of indicesToRemove because by the time this method is
    // called, these views have already been removed from the shadow hierarchy and the indices are
    // no longer useful to operate on
    for (int i = 0; i < tagsToRemove.length; i++) {
      int tagToRemove = tagsToRemove[i];
      boolean delete = false;
      for (int j = 0; j < tagsToDelete.length; j++) {
        if (tagsToDelete[j] == tagToRemove) {
          delete = true;
          break;
        }
      }
      ReactShadowNode nodeToRemove = mShadowNodeRegistry.getNode(tagToRemove);
      removeNodeFromParent(nodeToRemove, delete);
    }

    for (int i = 0; i < viewsToAdd.length; i++) {
      ViewAtIndex toAdd = viewsToAdd[i];
      ReactShadowNode nodeToAdd = mShadowNodeRegistry.getNode(toAdd.mTag);
      addNodeToNode(nodeToManage, nodeToAdd, toAdd.mIndex);
    }
  }

  /**
   * Handles a setChildren call.  This is a simplification of handleManagerChildren that only adds
   * children in index order of the childrenTags array
   */
  public void handleSetChildren(
    ReactShadowNode nodeToManage,
    ReadableArray childrenTags
  ) {
    if (!ENABLED) {
      mUIViewOperationQueue.enqueueSetChildren(
        nodeToManage.getReactTag(),
        childrenTags);
      return;
    }

    for (int i = 0; i < childrenTags.size(); i++) {
      ReactShadowNode nodeToAdd = mShadowNodeRegistry.getNode(childrenTags.getInt(i));
      addNodeToNode(nodeToManage, nodeToAdd, i);
    }
  }

  /**
   * Handles an updateLayout call. All updateLayout calls are collected and dispatched at the end
   * of a batch because updateLayout calls to layout-only nodes can necessitate multiple
   * updateLayout calls for all its children.
   */
  public void handleUpdateLayout(ReactShadowNode node) {
    if (!ENABLED) {
      mUIViewOperationQueue.enqueueUpdateLayout(
          Assertions.assertNotNull(node.getParent()).getReactTag(),
          node.getReactTag(),
          node.getScreenX(),
          node.getScreenY(),
          node.getScreenWidth(),
          node.getScreenHeight());
      return;
    }

    applyLayoutBase(node);
  }

  /**
   * Processes the shadow hierarchy to dispatch all necessary updateLayout calls to the native
   * hierarchy. Should be called after all updateLayout calls for a batch have been handled.
   */
  public void onBatchComplete() {
    mTagsWithLayoutVisited.clear();
  }

  private NodeIndexPair walkUpUntilNonLayoutOnly(
      ReactShadowNode node,
      int indexInNativeChildren) {
    while (node.isLayoutOnly()) {
      ReactShadowNode parent = node.getParent();
      if (parent == null) {
        return null;
      }

      indexInNativeChildren = indexInNativeChildren + parent.getNativeOffsetForChild(node);
      node = parent;
    }

    return new NodeIndexPair(node, indexInNativeChildren);
  }

  private void addNodeToNode(ReactShadowNode parent, ReactShadowNode child, int index) {
    int indexInNativeChildren = parent.getNativeOffsetForChild(parent.getChildAt(index));
    if (parent.isLayoutOnly()) {
      NodeIndexPair result = walkUpUntilNonLayoutOnly(parent, indexInNativeChildren);
      if (result == null) {
        // If the parent hasn't been attached to its native parent yet, don't issue commands to the
        // native hierarchy. We'll do that when the parent node actually gets attached somewhere.
        return;
      }
      parent = result.node;
      indexInNativeChildren = result.index;
    }

    if (!child.isLayoutOnly()) {
      addNonLayoutNode(parent, child, indexInNativeChildren);
    } else {
      addLayoutOnlyNode(parent, child, indexInNativeChildren);
    }
  }

  /**
   * For handling node removal from manageChildren. In the case of removing a layout-only node, we
   * need to instead recursively remove all its children from their native parents.
   */
  private void removeNodeFromParent(ReactShadowNode nodeToRemove, boolean shouldDelete) {
    ReactShadowNode nativeNodeToRemoveFrom = nodeToRemove.getNativeParent();

    if (nativeNodeToRemoveFrom != null) {
      int index = nativeNodeToRemoveFrom.indexOfNativeChild(nodeToRemove);
      nativeNodeToRemoveFrom.removeNativeChildAt(index);

      mUIViewOperationQueue.enqueueManageChildren(
          nativeNodeToRemoveFrom.getReactTag(),
          new int[]{index},
          null,
          shouldDelete ? new int[]{nodeToRemove.getReactTag()} : null);
    } else {
      for (int i = nodeToRemove.getChildCount() - 1; i >= 0; i--) {
        removeNodeFromParent(nodeToRemove.getChildAt(i), shouldDelete);
      }
    }
  }

  private void addLayoutOnlyNode(
      ReactShadowNode nonLayoutOnlyNode,
      ReactShadowNode layoutOnlyNode,
      int index) {
    addGrandchildren(nonLayoutOnlyNode, layoutOnlyNode, index);
  }

  private void addNonLayoutNode(
      ReactShadowNode parent,
      ReactShadowNode child,
      int index) {
    parent.addNativeChildAt(child, index);
    mUIViewOperationQueue.enqueueManageChildren(
        parent.getReactTag(),
        null,
        new ViewAtIndex[]{new ViewAtIndex(child.getReactTag(), index)},
        null);
  }

  private void addGrandchildren(
      ReactShadowNode nativeParent,
      ReactShadowNode child,
      int index) {
    Assertions.assertCondition(!nativeParent.isLayoutOnly());

    // `child` can't hold native children. Add all of `child`'s children to `parent`.
    int currentIndex = index;
    for (int i = 0; i < child.getChildCount(); i++) {
      ReactShadowNode grandchild = child.getChildAt(i);
      Assertions.assertCondition(grandchild.getNativeParent() == null);

      if (grandchild.isLayoutOnly()) {
        // Adding this child could result in adding multiple native views
        int grandchildCountBefore = nativeParent.getNativeChildCount();
        addLayoutOnlyNode(nativeParent, grandchild, currentIndex);
        int grandchildCountAfter = nativeParent.getNativeChildCount();
        currentIndex += grandchildCountAfter - grandchildCountBefore;
      } else {
        addNonLayoutNode(nativeParent, grandchild, currentIndex);
        currentIndex++;
      }
    }
  }

  private void applyLayoutBase(ReactShadowNode node) {
    int tag = node.getReactTag();
    if (mTagsWithLayoutVisited.get(tag)) {
      return;
    }
    mTagsWithLayoutVisited.put(tag, true);

    ReactShadowNode parent = node.getParent();

    // We use screenX/screenY (which round to integer pixels) at each node in the hierarchy to
    // emulate what the layout would look like if it were actually built with native views which
    // have to have integral top/left/bottom/right values
    int x = node.getScreenX();
    int y = node.getScreenY();

    while (parent != null && parent.isLayoutOnly()) {
      // TODO(7854667): handle and test proper clipping
      x += Math.round(parent.getLayoutX());
      y += Math.round(parent.getLayoutY());

      parent = parent.getParent();
    }

    applyLayoutRecursive(node, x, y);
  }

  private void applyLayoutRecursive(ReactShadowNode toUpdate, int x, int y) {
    if (!toUpdate.isLayoutOnly() && toUpdate.getNativeParent() != null) {
      int tag = toUpdate.getReactTag();
      mUIViewOperationQueue.enqueueUpdateLayout(
          toUpdate.getNativeParent().getReactTag(),
          tag,
          x,
          y,
          toUpdate.getScreenWidth(),
          toUpdate.getScreenHeight());
      return;
    }

    for (int i = 0; i < toUpdate.getChildCount(); i++) {
      ReactShadowNode child = toUpdate.getChildAt(i);
      int childTag = child.getReactTag();
      if (mTagsWithLayoutVisited.get(childTag)) {
        continue;
      }
      mTagsWithLayoutVisited.put(childTag, true);

      int childX = child.getScreenX();
      int childY = child.getScreenY();

      childX += x;
      childY += y;

      applyLayoutRecursive(child, childX, childY);
    }
  }

  private void transitionLayoutOnlyViewToNativeView(
      ReactShadowNode node,
      @Nullable ReactStylesDiffMap props) {
    ReactShadowNode parent = node.getParent();
    if (parent == null) {
      node.setIsLayoutOnly(false);
      return;
    }

    // First, remove the node from its parent. This causes the parent to update its native children
    // count. The removeNodeFromParent call will cause all the view's children to be detached from
    // their native parent.
    int childIndex = parent.indexOf(node);
    parent.removeChildAt(childIndex);
    removeNodeFromParent(node, false);

    node.setIsLayoutOnly(false);

    // Create the view since it doesn't exist in the native hierarchy yet
    mUIViewOperationQueue.enqueueCreateView(
        node.getRootNode().getThemedContext(),
        node.getReactTag(),
        node.getViewClass(),
        props);

    // Add the node and all its children as if we are adding a new nodes
    parent.addChildAt(node, childIndex);
    addNodeToNode(parent, node, childIndex);
    for (int i = 0; i < node.getChildCount(); i++) {
      addNodeToNode(node, node.getChildAt(i), i);
    }

    // Update layouts since the children of the node were offset by its x/y position previously.
    // Bit of a hack: we need to update the layout of this node's children now that it's no longer
    // layout-only, but we may still receive more layout updates at the end of this batch that we
    // don't want to ignore.
    Assertions.assertCondition(mTagsWithLayoutVisited.size() == 0);
    applyLayoutBase(node);
    for (int i = 0; i < node.getChildCount(); i++) {
      applyLayoutBase(node.getChildAt(i));
    }
    mTagsWithLayoutVisited.clear();
  }

  private static boolean isLayoutOnlyAndCollapsable(@Nullable ReactStylesDiffMap props) {
    if (props == null) {
      return true;
    }

    if (props.hasKey(ViewProps.COLLAPSABLE) && !props.getBoolean(ViewProps.COLLAPSABLE, true)) {
      return false;
    }

    ReadableMapKeySetIterator keyIterator = props.mBackingMap.keySetIterator();
    while (keyIterator.hasNextKey()) {
      if (!ViewProps.isLayoutOnly(props.mBackingMap, keyIterator.nextKey())) {
        return false;
      }
    }
    return true;
  }
}
