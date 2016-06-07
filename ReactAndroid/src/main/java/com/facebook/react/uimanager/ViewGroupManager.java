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

/**
 * Class providing children management API for view managers of classes extending ViewGroup.
 */
public abstract class ViewGroupManager <T extends ViewGroup>
    extends BaseViewManager<T, LayoutShadowNode> {

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
