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

import android.view.View;
import android.view.View.MeasureSpec;
import android.view.ViewGroup;

import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.SizeMonitoringFrameLayout;
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
    super(viewManagers);
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
      @Nullable NodeRegion[] nodeRegions,
      boolean hasOverflowingElements) {
    FlatViewGroup view = (FlatViewGroup) resolveView(reactTag);
    if (drawCommands != null) {
      view.mountDrawCommands(drawCommands, hasOverflowingElements);
    }
    if (listeners != null) {
      view.mountAttachDetachListeners(listeners);
    }
    if (nodeRegions != null) {
      view.mountNodeRegions(nodeRegions);
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
    for (int i = 0; i < viewsToAdd.length; ++i) {
      int tag = Math.abs(viewsToAdd[i]);
      viewManager.addView(viewGroup, resolveView(tag), i);
    }
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

  /* package */ void dropViews(int[] viewsToDrop) {
    for (int viewToDrop : viewsToDrop) {
      dropView(resolveView(viewToDrop));
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
      for (int i = viewManager.getChildCount(viewGroup) - 1; i >= 0; --i) {
        viewManager.removeViewAt(viewGroup, i);
      }
    }
  }
}
