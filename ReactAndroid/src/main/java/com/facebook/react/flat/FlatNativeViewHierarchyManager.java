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

import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.SizeMonitoringFrameLayout;
import com.facebook.react.uimanager.ThemedReactContext;
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
      @Nullable AttachDetachListener[] listeners) {
    FlatViewGroup view = (FlatViewGroup) resolveView(reactTag);
    if (drawCommands != null) {
      view.mountDrawCommands(drawCommands);
    }
    if (listeners != null) {
      view.mountAttachDetachListeners(listeners);
    }
  }

  /* package */ void updateViewGroup(int reactTag, int[] viewsToAdd, int[] viewsToDetach) {
    FlatViewGroup view = (FlatViewGroup) resolveView(reactTag);
    view.mountViews(this, viewsToAdd, viewsToDetach);
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

  /* package */ void detachAllChildrenFromViews(int[] viewsToDetachAllChildrenFrom) {
    for (int viewTag : viewsToDetachAllChildrenFrom) {
      FlatViewGroup viewGroup = (FlatViewGroup) resolveView(viewTag);
      viewGroup.detachAllViewsFromParent();
    }
  }
}
