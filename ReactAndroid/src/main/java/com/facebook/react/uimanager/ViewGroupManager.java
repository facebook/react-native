/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.uimanager;

import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.WeakHashMap;

/**
 * Class providing children management API for view managers of classes extending ViewGroup.
 */
public abstract class ViewGroupManager <T extends ViewGroup>
    extends BaseViewManager<T, LayoutShadowNode> {

  public static WeakHashMap<View, Integer> mZIndexHash = new WeakHashMap<>();

  @Override
  public LayoutShadowNode createShadowNodeInstance() {
    return new LayoutShadowNode();
  }

  @Override
  public Class<? extends LayoutShadowNode> getShadowNodeClass() {
    return LayoutShadowNode.class;
  }

  @Override
  public void updateExtraData(T root, Object extraData) {
  }

  public void addView(T parent, View child, int index) {
    parent.addView(child, index);
    reorderChildrenByZIndex(parent);
  }

  public static void setViewZIndex(View view, int zIndex) {
    mZIndexHash.put(view, zIndex);
    // zIndex prop gets set BEFORE the view is added, so parent may be null.
    ViewGroup parent = (ViewGroup) view.getParent();
    if (parent != null) {
      reorderChildrenByZIndex(parent);
    }
  }

  public static void reorderChildrenByZIndex(ViewGroup view) {
    // Optimization: loop through the zIndexHash to test if there are any non-zero zIndexes
    // If there aren't any, we can just return out
    Collection<Integer> zIndexes = mZIndexHash.values();
    boolean containsZIndexedElement = false;
    for (Integer zIndex : zIndexes) {
      if (zIndex != 0) {
        containsZIndexedElement = true;
        break;
      }
    }
    if (!containsZIndexedElement) {
      return;
    }

    // Add all children to a sortable ArrayList
    ArrayList<View> viewsToSort = new ArrayList<>();
    for (int i = 0; i < view.getChildCount(); i++) {
      viewsToSort.add(view.getChildAt(i));
    }
    // Sort the views by zIndex
    Collections.sort(viewsToSort, new Comparator<View>() {
      @Override
      public int compare(View view1, View view2) {
        Integer view1ZIndex = mZIndexHash.get(view1);
        if (view1ZIndex == null) {
          view1ZIndex = 0;
        }

        Integer view2ZIndex = mZIndexHash.get(view2);
        if (view2ZIndex == null) {
          view2ZIndex = 0;
        }
        return view1ZIndex - view2ZIndex;
      }
    });
    // Call .bringToFront on the sorted list of views
    for (int i = 0; i < viewsToSort.size(); i++) {
      viewsToSort.get(i).bringToFront();
    }
    view.invalidate();
  }

  public int getChildCount(T parent) {
    return parent.getChildCount();
  }

  public View getChildAt(T parent, int index) {
    return parent.getChildAt(index);
  }

  public void removeViewAt(T parent, int index) {
    parent.removeViewAt(index);
  }

  public void removeView(T parent, View view) {
    for (int i = 0; i < getChildCount(parent); i++) {
      if (getChildAt(parent, i) == view) {
        removeViewAt(parent, i);
        break;
      }
    }
  }

  public void removeAllViews(T parent) {
    for (int i = getChildCount(parent) - 1; i >= 0; i--) {
      removeViewAt(parent, i);
    }
  }

  /**
   * Returns whether this View type needs to handle laying out its own children instead of
   * deferring to the standard css-layout algorithm.
   * Returns true for the layout to *not* be automatically invoked. Instead onLayout will be
   * invoked as normal and it is the View instance's responsibility to properly call layout on its
   * children.
   * Returns false for the default behavior of automatically laying out children without going
   * through the ViewGroup's onLayout method. In that case, onLayout for this View type must *not*
   * call layout on its children.
   */
  public boolean needsCustomLayoutForChildren() {
    return false;
  }

  /**
   * Returns whether or not this View type should promote its grandchildren as Views. This is an
   * optimization for Scrollable containers when using Nodes, where instead of having one ViewGroup
   * containing a large number of draw commands (and thus being more expensive in the case of
   * an invalidate or re-draw), we split them up into several draw commands.
   */
  public boolean shouldPromoteGrandchildren() {
    return false;
  }
}
