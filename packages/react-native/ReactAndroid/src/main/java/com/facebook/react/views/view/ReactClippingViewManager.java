/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * View manager which handles clipped subviews. Useful for custom views which extends from {@link
 * com.facebook.react.views.view.ReactViewGroup}
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public abstract class ReactClippingViewManager<T extends ReactViewGroup>
    extends ViewGroupManager<T> {

  @ReactProp(
      name = com.facebook.react.uimanager.ReactClippingViewGroupHelper.PROP_REMOVE_CLIPPED_SUBVIEWS)
  public void setRemoveClippedSubviews(T view, boolean removeClippedSubviews) {
    UiThreadUtil.assertOnUiThread();

    view.setRemoveClippedSubviews(removeClippedSubviews);
  }

  @Override
  public void addView(T parent, View child, int index) {
    UiThreadUtil.assertOnUiThread();

    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      parent.addViewWithSubviewClippingEnabled(child, index);
    } else {
      parent.addView(child, index);
    }
  }

  @Override
  public int getChildCount(T parent) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      return parent.getAllChildrenCount();
    } else {
      return parent.getChildCount();
    }
  }

  @Override
  @Nullable
  public View getChildAt(T parent, int index) {
    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      return parent.getChildAtWithSubviewClippingEnabled(index);
    } else {
      return parent.getChildAt(index);
    }
  }

  @Override
  public void removeViewAt(T parent, int index) {
    UiThreadUtil.assertOnUiThread();

    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      View child = getChildAt(parent, index);
      if (child != null) {
        if (child.getParent() != null) {
          parent.removeView(child);
        }
        parent.removeViewWithSubviewClippingEnabled(child);
      }
    } else {
      parent.removeViewAt(index);
    }
  }

  @Override
  public void removeAllViews(T parent) {
    UiThreadUtil.assertOnUiThread();

    boolean removeClippedSubviews = parent.getRemoveClippedSubviews();
    if (removeClippedSubviews) {
      parent.removeAllViewsWithSubviewClippingEnabled();
    } else {
      parent.removeAllViews();
    }
  }
}
