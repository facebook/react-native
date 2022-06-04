/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.UiThreadUtil;
import java.util.List;
import java.util.WeakHashMap;

/** Class providing children management API for view managers of classes extending ViewGroup. */
public abstract class ViewGroupManager<T extends ViewGroup>
    extends BaseViewManager<T, LayoutShadowNode> implements IViewManagerWithChildren {

  private static WeakHashMap<View, Integer> mZIndexHash = new WeakHashMap<>();

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new LayoutShadowNode();
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return LayoutShadowNode.class;
  }

  @Override
  public void updateExtraData(T root, Object extraData) {}

  public void addView(T parent, View child, int index) {
    parent.addView(child, index);
  }

  /**
   * Convenience method for batching a set of addView calls Note that this adds the views to the
   * beginning of the ViewGroup
   *
   * @param parent the parent ViewGroup
   * @param views the set of views to add
   */
  public void addViews(T parent, List<View> views) {
    UiThreadUtil.assertOnUiThread();

    for (int i = 0, size = views.size(); i < size; i++) {
      addView(parent, views.get(i), i);
    }
  }

  public static void setViewZIndex(View view, int zIndex) {
    mZIndexHash.put(view, zIndex);
  }

  public static @Nullable Integer getViewZIndex(View view) {
    return mZIndexHash.get(view);
  }

  public int getChildCount(T parent) {
    return parent.getChildCount();
  }

  public View getChildAt(T parent, int index) {
    return parent.getChildAt(index);
  }

  public void removeViewAt(T parent, int index) {
    UiThreadUtil.assertOnUiThread();

    parent.removeViewAt(index);
  }

  public void removeView(T parent, View view) {
    UiThreadUtil.assertOnUiThread();

    for (int i = 0; i < getChildCount(parent); i++) {
      if (getChildAt(parent, i) == view) {
        removeViewAt(parent, i);
        break;
      }
    }
  }

  public void removeAllViews(T parent) {
    UiThreadUtil.assertOnUiThread();

    for (int i = getChildCount(parent) - 1; i >= 0; i--) {
      removeViewAt(parent, i);
    }
  }

  /**
   * Returns whether this View type needs to handle laying out its own children instead of deferring
   * to the standard css-layout algorithm. Returns true for the layout to *not* be automatically
   * invoked. Instead onLayout will be invoked as normal and it is the View instance's
   * responsibility to properly call layout on its children. Returns false for the default behavior
   * of automatically laying out children without going through the ViewGroup's onLayout method. In
   * that case, onLayout for this View type must *not* call layout on its children.
   */
  @Override
  public boolean needsCustomLayoutForChildren() {
    return false;
  }

  /**
   * Returns whether or not this View type should promote its grandchildren as Views. This is an
   * optimization for Scrollable containers when using Nodes, where instead of having one ViewGroup
   * containing a large number of draw commands (and thus being more expensive in the case of an
   * invalidate or re-draw), we split them up into several draw commands.
   */
  public boolean shouldPromoteGrandchildren() {
    return false;
  }
}
