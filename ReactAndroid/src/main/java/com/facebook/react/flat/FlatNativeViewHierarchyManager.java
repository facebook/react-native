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
import java.util.Collection;
import java.util.List;

import android.graphics.Rect;
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

  /* package */ void dropViews(int[] viewsToDrop) {
    for (int viewToDrop : viewsToDrop) {
      if (viewToDrop > 0) {
        dropView(resolveView(viewToDrop));
      } else {
        // Root views are noted with a negative tag from StateBuilder.
        removeRootView(-viewToDrop);
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
        Collection<View> detachedViews = flatViewGroup.getDetachedViews();
        for (View detachedChild : detachedViews) {
          // we can do super here because removeClippedSubviews is currently not recursive. if/when
          // we become recursive one day, this should call vanilla dropView to be recursive as well.
          super.dropView(detachedChild);
          // trigger onDetachedFromWindow - this is currently needed due to using attach/detach
          // instead of add/remove. if we move to add/remove in the future, we can remove this.
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
