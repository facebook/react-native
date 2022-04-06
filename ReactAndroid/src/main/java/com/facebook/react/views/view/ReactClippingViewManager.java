/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.view.FocusFinder;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * View manager which handles clipped subviews. Useful for custom views which extends from {@link
 * com.facebook.react.views.view.ReactViewGroup}
 */
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
      if (child.getParent() != null) {
        parent.removeView(child);
      }
      parent.removeViewWithSubviewClippingEnabled(child);
    } else {
      // Prevent focus leaks due to removal of a focused View
      if (parent.getChildAt(index).hasFocus()) {
        giveFocusToAppropriateView(parent, parent.getChildAt(index));
      }
      parent.removeViewAt(index);
    }
  }

  private void giveFocusToAppropriateView(@NonNull ViewGroup parent, @NonNull View focusedView) {
    // Search for appropriate sibling
    View viewToTakeFocus = null;
    while (parent != null) {
      // Search DOWN
      viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_DOWN);
      if (viewToTakeFocus == null) {
        // Search RIGHT
        viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_RIGHT);
        if (viewToTakeFocus == null) {
          // Search UP
          viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_UP);
          if (viewToTakeFocus == null) {
            // Search LEFT
            viewToTakeFocus = FocusFinder.getInstance().findNextFocus(parent, focusedView, View.FOCUS_LEFT);
          }
        }
      }
      if (viewToTakeFocus != null || !(parent.getParent() instanceof ViewGroup)) {
        break;
      }
      parent = (ViewGroup) parent.getParent();
    }

    // Give focus to View
    if (viewToTakeFocus != null) {
      viewToTakeFocus.requestFocus();
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
