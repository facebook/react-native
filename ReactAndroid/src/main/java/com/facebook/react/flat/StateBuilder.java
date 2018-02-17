/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.ArrayList;

import android.util.SparseIntArray;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.OnLayoutEvent;
import com.facebook.react.uimanager.Spacing;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.events.EventDispatcher;

/**
 * Shadow node hierarchy by itself cannot display UI, it is only a representation of what UI should
 * be from JavaScript perspective. StateBuilder is a helper class that walks the shadow node tree
 * and collects information into an operation queue that is run on the UI thread and applied to the
 * non-shadow hierarchy of Views that Android can finally display.
 */
/* package */ final class StateBuilder {
  /* package */ static final float[] EMPTY_FLOAT_ARRAY = new float[0];
  /* package */ static final SparseIntArray EMPTY_SPARSE_INT = new SparseIntArray();

  private static final boolean SKIP_UP_TO_DATE_NODES = true;

  // Optimization to avoid re-allocating zero length arrays.
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
  private final ArrayList<Integer> mViewsToDrop = new ArrayList<>();
  private final ArrayList<Integer> mParentsForViewsToDrop = new ArrayList<>();
  private final ArrayList<OnLayoutEvent> mOnLayoutEvents = new ArrayList<>();
  private final ArrayList<UIViewOperationQueue.UIOperation> mUpdateViewBoundsOperations =
      new ArrayList<>();
  private final ArrayList<UIViewOperationQueue.UIOperation> mViewManagerCommands =
      new ArrayList<>();

  private @Nullable FlatUIViewOperationQueue.DetachAllChildrenFromViews mDetachAllChildrenFromViews;

  /* package */ StateBuilder(FlatUIViewOperationQueue operationsQueue) {
    mOperationsQueue = operationsQueue;
  }

  /* package */ FlatUIViewOperationQueue getOperationsQueue() {
    return mOperationsQueue;
  }

  /**
   * Given a root of the laid-out shadow node hierarchy, walks the tree and generates arrays from
   * element lists that are mounted in the UI thread to FlatViewGroups to handle drawing, touch,
   * and other logic.
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

  /**
   * Run after the shadow node hierarchy is updated.  Detaches all children from Views that are
   * changing their native children, updates views, and dispatches commands before discarding any
   * dropped views.
   *
   * @param eventDispatcher Dispatcher for onLayout events.
   */
  void afterUpdateViewHierarchy(EventDispatcher eventDispatcher) {
    if (mDetachAllChildrenFromViews != null) {
      int[] viewsToDetachAllChildrenFrom = collectViewTags(mViewsToDetachAllChildrenFrom);
      mViewsToDetachAllChildrenFrom.clear();

      mDetachAllChildrenFromViews.setViewsToDetachAllChildrenFrom(viewsToDetachAllChildrenFrom);
      mDetachAllChildrenFromViews = null;
    }

    for (int i = 0, size = mUpdateViewBoundsOperations.size(); i != size; ++i) {
      mOperationsQueue.enqueueFlatUIOperation(mUpdateViewBoundsOperations.get(i));
    }
    mUpdateViewBoundsOperations.clear();

    // Process view manager commands after bounds operations, so that any UI operations have already
    // happened before we actually dispatch the view manager command.  This prevents things like
    // commands going to empty parents and views not yet being created.
    for (int i = 0, size = mViewManagerCommands.size(); i != size; i++) {
      mOperationsQueue.enqueueFlatUIOperation(mViewManagerCommands.get(i));
    }
    mViewManagerCommands.clear();

    // This could be more efficient if EventDispatcher had a batch mode
    // to avoid multiple synchronized calls.
    for (int i = 0, size = mOnLayoutEvents.size(); i != size; ++i) {
      eventDispatcher.dispatchEvent(mOnLayoutEvents.get(i));
    }
    mOnLayoutEvents.clear();

    if (mViewsToDrop.size() > 0) {
      mOperationsQueue.enqueueDropViews(mViewsToDrop, mParentsForViewsToDrop);
      mViewsToDrop.clear();
      mParentsForViewsToDrop.clear();
    }

    mOperationsQueue.enqueueProcessLayoutRequests();
  }

  /* package */ void removeRootView(int rootViewTag) {
    // Note root view tags with a negative value.
    mViewsToDrop.add(-rootViewTag);
    mParentsForViewsToDrop.add(-1);
  }

  /**
   * Adds a draw command to the element list for the current scope.  Allows collectState within the
   * shadow node to add commands.
   *
   * @param drawCommand The draw command to add.
   */
  /* package */ void addDrawCommand(AbstractDrawCommand drawCommand) {
    mDrawCommands.add(drawCommand);
  }

  /**
   * Adds a listener to the element list for the current scope.  Allows collectState within the
   * shadow node to add listeners.
   *
   * @param listener The listener to add
   */
  /* package */ void addAttachDetachListener(AttachDetachListener listener) {
    mAttachDetachListeners.add(listener);
  }

  /**
   * Adds a command for a view manager to the queue.  We have to delay adding it to the operations
   * queue until we have added our view moves, creations and updates.
   *
   * @param reactTag The react tag of the command target.
   * @param commandId ID of the command.
   * @param commandArgs Arguments for the command.
   */
  /* package */ void enqueueViewManagerCommand(
      int reactTag,
      int commandId,
      ReadableArray commandArgs) {
    mViewManagerCommands.add(
        mOperationsQueue.createViewManagerCommand(reactTag, commandId, commandArgs));
  }

  /**
   * Create a backing view for a node, or update the backing view if it has already been created.
   *
   * @param node The node to create the backing view for.
   * @param styles Styles for the view.
   */
  /* package */ void enqueueCreateOrUpdateView(
      FlatShadowNode node,
      @Nullable ReactStylesDiffMap styles) {
    if (node.isBackingViewCreated()) {
      // If the View is already created, make sure to propagate the new styles.
      mOperationsQueue.enqueueUpdateProperties(
          node.getReactTag(),
          node.getViewClass(),
          styles);
    } else {
      mOperationsQueue.enqueueCreateView(
          node.getThemedContext(),
          node.getReactTag(),
          node.getViewClass(),
          styles);

      node.signalBackingViewIsCreated();
    }
  }

  /**
   * Create a backing view for a node if not already created.
   *
   * @param node The node to create the backing view for.
   */
  /* package */ void ensureBackingViewIsCreated(FlatShadowNode node) {
    if (node.isBackingViewCreated()) {
      return;
    }

    int tag = node.getReactTag();
    mOperationsQueue.enqueueCreateView(node.getThemedContext(), tag, node.getViewClass(), null);

    node.signalBackingViewIsCreated();
  }

  /**
   * Enqueue dropping of the view for a node that has a backing view.  Used in conjunction with
   * remove the node from the shadow hierarchy.
   *
   * @param node The node to drop the backing view for.
   */
  /* package */ void dropView(FlatShadowNode node, int parentReactTag) {
    mViewsToDrop.add(node.getReactTag());
    mParentsForViewsToDrop.add(parentReactTag);
  }

  /**
   * Adds a node region to the element list for the current scope.  Allows collectState to add
   * regions.
   *
   * @param node The node to add a region for.
   * @param left Bound of the region.
   * @param top Bound of the region.
   * @param right Bound of the region.
   * @param bottom Bound of the region.
   * @param isVirtual True if the region does not map to a native view.  Used to determine touch
   *   targets.
   */
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
    if (node.doesDraw()) {
      mNodeRegions.add(node.getNodeRegion());
    }
  }

  /**
   * Adds a native child to the element list for the current scope.  Allows collectState to add
   * native children.
   *
   * @param nativeChild The view-backed native child to add.
   */
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
   * Collects state (Draw commands, listeners, regions, native children) for a given node that will
   * mount to a View. Returns true if this node or any of its descendants that mount to View
   * generated any updates.
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

    boolean expectingUpdate = hasUpdates || node.isUpdated() || node.hasUnseenUpdates() ||
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

    // We need to finish the native children so that we can process clipping FlatViewGroup.
    final FlatShadowNode[] nativeChildren = mNativeChildren.finish();
    if (shouldUpdateMountState) {
      if (node.clipsSubviews()) {
        // Node is a clipping FlatViewGroup, so lets do some calculations off the UI thread.
        // DrawCommandManager has a better explanation of the data incoming from these calculations,
        // and is where they are actually used.
        float[] commandMaxBottom = EMPTY_FLOAT_ARRAY;
        float[] commandMinTop = EMPTY_FLOAT_ARRAY;
        SparseIntArray drawViewIndexMap = EMPTY_SPARSE_INT;
        if (drawCommands != null) {
          drawViewIndexMap = new SparseIntArray();

          commandMaxBottom = new float[drawCommands.length];
          commandMinTop = new float[drawCommands.length];

          if (node.isHorizontal()) {
            HorizontalDrawCommandManager
                .fillMaxMinArrays(drawCommands, commandMaxBottom, commandMinTop, drawViewIndexMap);
          } else {
            VerticalDrawCommandManager
                .fillMaxMinArrays(drawCommands, commandMaxBottom, commandMinTop, drawViewIndexMap);
          }
        }
        float[] regionMaxBottom = EMPTY_FLOAT_ARRAY;
        float[] regionMinTop = EMPTY_FLOAT_ARRAY;
        if (nodeRegions != null) {
          regionMaxBottom = new float[nodeRegions.length];
          regionMinTop = new float[nodeRegions.length];

          if (node.isHorizontal()) {
            HorizontalDrawCommandManager
                .fillMaxMinArrays(nodeRegions, regionMaxBottom, regionMinTop);
          } else {
            VerticalDrawCommandManager
                .fillMaxMinArrays(nodeRegions, regionMaxBottom, regionMinTop);
          }
        }

        boolean willMountViews = nativeChildren != null;
        mOperationsQueue.enqueueUpdateClippingMountState(
            node.getReactTag(),
            drawCommands,
            drawViewIndexMap,
            commandMaxBottom,
            commandMinTop,
            listeners,
            nodeRegions,
            regionMaxBottom,
            regionMinTop,
            willMountViews);
      } else {
        mOperationsQueue.enqueueUpdateMountState(
            node.getReactTag(),
            drawCommands,
            listeners,
            nodeRegions);
      }
    }

    if (node.hasUnseenUpdates()) {
      node.onCollectExtraUpdates(mOperationsQueue);
      node.markUpdateSeen();
    }

    if (nativeChildren != null) {
      updateNativeChildren(node, node.getNativeChildren(), nativeChildren);
    }

    boolean updated = shouldUpdateMountState || nativeChildren != null || descendantUpdated;

    if (!expectingUpdate && updated) {
      throw new RuntimeException("Node " + node.getReactTag() + " updated unexpectedly.");
    }

    return updated;
  }

  /**
   * Handles updating the children of a node when they change.  Updates the shadow node and
   * enqueues state updates that will eventually be run on the UI thread.
   *
   * @param node The node to update native children for.
   * @param oldNativeChildren The previously mounted native children.
   * @param newNativeChildren The newly mounted native children.
   */
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
   * Recursively walks node tree from a given node and collects draw commands, listeners, node
   * regions and native children.  Calls collect state on the node, then processNodeAndCollectState
   * for the recursion.
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

  /**
   * Collects state and enqueues View boundary updates for a given node tree.  Returns true if
   * this node or any of its descendants that mount to View generated any updates.
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
      updated = collectStateForMountableNode(
          node,
          0, // left - left
          0, // top - top
          right - left,
          bottom - top,
          parentClipLeft - left,
          parentClipTop - top,
          parentClipRight - left,
          parentClipBottom - top);

      if (!parentIsAndroidView) {
        mDrawCommands.add(node.collectDrawView(
            left,
            top,
            right,
            bottom,
            parentClipLeft,
            parentClipTop,
            parentClipRight,
            parentClipBottom));
      }

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
      mOperationsQueue.enqueueSetPadding(
          reactTag,
          Math.round(androidView.getPadding(Spacing.LEFT)),
          Math.round(androidView.getPadding(Spacing.TOP)),
          Math.round(androidView.getPadding(Spacing.RIGHT)),
          Math.round(androidView.getPadding(Spacing.BOTTOM)));
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
