/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

import android.util.SparseArray;
import android.util.SparseIntArray;
import android.view.View;
import android.view.View.MeasureSpec;
import android.view.ViewGroup;

import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerRegistry;

/**
 * FlatNativeViewHierarchyManager is the only class that performs View manipulations. All of this
 * class methods can only be called from UI thread by {@link FlatUIViewOperationQueue}.
 */
/* package */ final class FlatNativeViewHierarchyManager extends NativeViewHierarchyManager
    implements ViewResolver {

  /* package */ FlatNativeViewHierarchyManager(ViewManagerRegistry viewManagers) {
    super(viewManagers, new FlatRootViewManager());
  }

  @Override
  public View getView(int reactTag) {
    return super.resolveView(reactTag);
  }

  @Override
  public void addRootView(
      int tag,
      SizeMonitoringFrameLayout view,
      ThemedReactContext themedContext) {
    FlatViewGroup root = new FlatViewGroup(themedContext);
    view.addView(root);

    // When unmounting, ReactInstanceManager.detachViewFromInstance() will check id of the
    // top-level View (SizeMonitoringFrameLayout) and pass it back to JS. We want that View's id to
    // be set, otherwise NativeViewHierarchyManager will not be able to cleanup properly.
    view.setId(tag);

    addRootViewGroup(tag, root, themedContext);
  }

  /**
   * Updates DrawCommands and AttachDetachListeners of a FlatViewGroup specified by a reactTag.
   *
   * @param reactTag reactTag to lookup FlatViewGroup by
   * @param drawCommands if non-null, new draw commands to execute during the drawing.
   * @param listeners if non-null, new attach-detach listeners.
   */
  /* package */ void updateMountState(
      int reactTag,
      @Nullable DrawCommand[] drawCommands,
      @Nullable AttachDetachListener[] listeners,
      @Nullable NodeRegion[] nodeRegions) {
    FlatViewGroup view = (FlatViewGroup) resolveView(reactTag);
    if (drawCommands != null) {
      view.mountDrawCommands(drawCommands);
    }
    if (listeners != null) {
      view.mountAttachDetachListeners(listeners);
    }
    if (nodeRegions != null) {
      view.mountNodeRegions(nodeRegions);
    }
  }

  /**
   * Updates DrawCommands and AttachDetachListeners of a clipping FlatViewGroup specified by a
   * reactTag.
   *
   * @param reactTag The react tag to lookup FlatViewGroup by.
   * @param drawCommands If non-null, new draw commands to execute during the drawing.
   * @param drawViewIndexMap Mapping of react tags to the index of the corresponding DrawView
   *   command in the draw command array.
   * @param commandMaxBot At each index i, the maximum bottom value (or right value in the case of
   *   horizontal clipping) value of all draw commands at or below i.
   * @param commandMinTop At each index i, the minimum top value (or left value in the case of
   *   horizontal clipping) value of all draw commands at or below i.
   * @param listeners If non-null, new attach-detach listeners.
   * @param nodeRegions Node regions to mount.
   * @param regionMaxBot At each index i, the maximum bottom value (or right value in the case of
   *   horizontal clipping) value of all node regions at or below i.
   * @param regionMinTop At each index i, the minimum top value (or left value in the case of
   *   horizontal clipping) value of all draw commands at or below i.
   * @param willMountViews Whether we are going to also send a mountViews command in this state
   *   cycle.
   */
  /* package */ void updateClippingMountState(
      int reactTag,
      @Nullable DrawCommand[] drawCommands,
      SparseIntArray drawViewIndexMap,
      float[] commandMaxBot,
      float[] commandMinTop,
      @Nullable AttachDetachListener[] listeners,
      @Nullable NodeRegion[] nodeRegions,
      float[] regionMaxBot,
      float[] regionMinTop,
      boolean willMountViews) {
    FlatViewGroup view = (FlatViewGroup) resolveView(reactTag);
    if (drawCommands != null) {
      view.mountClippingDrawCommands(
          drawCommands,
          drawViewIndexMap,
          commandMaxBot,
          commandMinTop,
          willMountViews);
    }
    if (listeners != null) {
      view.mountAttachDetachListeners(listeners);
    }
    if (nodeRegions != null) {
      view.mountClippingNodeRegions(nodeRegions, regionMaxBot, regionMinTop);
    }
  }

  /* package */ void updateViewGroup(int reactTag, int[] viewsToAdd, int[] viewsToDetach) {
    View view = resolveView(reactTag);
    if (view instanceof FlatViewGroup) {
      ((FlatViewGroup) view).mountViews(this, viewsToAdd, viewsToDetach);
      return;
    }

    ViewGroup viewGroup = (ViewGroup) view;
    ViewGroupManager viewManager = (ViewGroupManager) resolveViewManager(reactTag);
    List<View> listOfViews = new ArrayList<>(viewsToAdd.length);

    // batch the set of additions - some view managers can take advantage of the batching to
    // decrease operations, etc.
    for (int viewIdToAdd : viewsToAdd) {
      int tag = Math.abs(viewIdToAdd);
      listOfViews.add(resolveView(tag));
    }
    viewManager.addViews(viewGroup, listOfViews);
  }

  /**
   * Updates View bounds, possibly re-measuring and re-layouting it if the size changed.
   *
   * @param reactTag reactTag to lookup a View by
   * @param left left coordinate relative to parent
   * @param top top coordinate relative to parent
   * @param right right coordinate relative to parent
   * @param bottom bottom coordinate relative to parent
   */
  /* package */ void updateViewBounds(int reactTag, int left, int top, int right, int bottom) {
    View view = resolveView(reactTag);
    int width = right - left;
    int height = bottom - top;
    if (view.getWidth() != width || view.getHeight() != height) {
      // size changed, we need to measure and layout the View
      view.measure(
          MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY));
      view.layout(left, top, right, bottom);
    } else {
      // same size, only location changed, there is a faster route.
      view.offsetLeftAndRight(left - view.getLeft());
      view.offsetTopAndBottom(top - view.getTop());
    }
  }

  /* package */ void setPadding(
      int reactTag,
      int paddingLeft,
      int paddingTop,
      int paddingRight,
      int paddingBottom) {
    resolveView(reactTag).setPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
  }

  /* package */ void dropViews(SparseIntArray viewsToDrop) {
    for (int i = 0, count = viewsToDrop.size(); i < count; i++) {
      int viewToDrop = viewsToDrop.keyAt(i);
      View view = null;
      if (viewToDrop > 0) {
        try {
          view = resolveView(viewToDrop);
          dropView(view);
        } catch (Exception e) {
          // the view is already dropped, nothing we can do
        }
      } else {
        // Root views are noted with a negative tag from StateBuilder.
        removeRootView(-viewToDrop);
      }

      int parentTag = viewsToDrop.valueAt(i);
      // this only happens for clipped, non-root views - clipped because there is no parent, and
      // not a root view (because we explicitly pass -1 for root views).
      if (parentTag > 0 && view != null && view.getParent() == null) {
        // this can only happen if the parent exists (if the parent were removed first, it'd also
        // remove the child, so trying to explicitly remove the child afterwards would crash at
        // the resolveView call above) - we also explicitly check for a null parent, implying that
        // we are either clipped (or that we already removed the child from its parent, in which
        // case this will essentially be a no-op).
        View parent = resolveView(parentTag);
        if (parent instanceof FlatViewGroup) {
          ((FlatViewGroup) parent).onViewDropped(view);
        }
      }
    }
  }

  @Override
  protected void dropView(View view) {
    super.dropView(view);

    // As a result of removeClippedSubviews, some views have strong references but are not attached
    // to a parent. consequently, when the parent gets removed, these Views don't get cleaned up,
    // because they aren't children (they also aren't removed from mTagsToViews, thus causing a
    // leak). To solve this, we ask for said detached views and explicitly drop them.
    if (view instanceof FlatViewGroup) {
      FlatViewGroup flatViewGroup = (FlatViewGroup) view;
      if (flatViewGroup.getRemoveClippedSubviews()) {
        SparseArray<View> detachedViews = flatViewGroup.getDetachedViews();
        for (int i = 0, size = detachedViews.size(); i < size; i++) {
          View detachedChild = detachedViews.valueAt(i);
          try {
             dropView(detachedChild);
          } catch (Exception e) {
             // if the view is already dropped, ignore any exceptions
             // in reality, we should find out the edge cases that cause
             // this to happen and properly fix them.
          }
          // trigger onDetachedFromWindow and clean up this detached/clipped view
          flatViewGroup.removeDetachedView(detachedChild);
        }
      }
    }
  }

  /* package */ void detachAllChildrenFromViews(int[] viewsToDetachAllChildrenFrom) {
    for (int viewTag : viewsToDetachAllChildrenFrom) {
      View view = resolveView(viewTag);
      if (view instanceof FlatViewGroup) {
        ((FlatViewGroup) view).detachAllViewsFromParent();
        continue;
      }

      ViewGroup viewGroup = (ViewGroup) view;
      ViewGroupManager viewManager = (ViewGroupManager) resolveViewManager(viewTag);
      viewManager.removeAllViews(viewGroup);
    }
  }
}
