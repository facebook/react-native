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
import java.util.Collections;
import java.util.Comparator;

import javax.annotation.Nullable;

/**
 * Helper to handle implementing ViewGroups with custom drawing order based on z-index.
 */
public class ViewGroupDrawingOrderHelper {
  private final ViewGroup mViewGroup;
  private int mNumberOfChildrenWithZIndex = 0;
  private @Nullable int[] mDrawingOrderIndices;

  public ViewGroupDrawingOrderHelper(ViewGroup viewGroup) {
    mViewGroup = viewGroup;
  }

  /**
   * This should be called every time a view is added to the ViewGroup in {@link ViewGroup#addView}.
   * @param view The view that is being added
   */
  public void handleAddView(View view) {
    if (ViewGroupManager.getViewZIndex(view) != null) {
      mNumberOfChildrenWithZIndex++;
    }

    mDrawingOrderIndices = null;
  }

  /**
   * This should be called every time a view is removed from the ViewGroup in {@link ViewGroup#removeView}
   * and {@link ViewGroup#removeViewAt}.
   * @param view The view that is being removed.
   */
  public void handleRemoveView(View view) {
    if (ViewGroupManager.getViewZIndex(view) != null) {
      mNumberOfChildrenWithZIndex--;
    }

    mDrawingOrderIndices = null;
  }

  /**
   * If the ViewGroup should enable drawing order. ViewGroups should call
   * {@link ViewGroup#setChildrenDrawingOrderEnabled} with the value returned from this method when
   * a view is added or removed.
   */
  public boolean shouldEnableCustomDrawingOrder() {
    return mNumberOfChildrenWithZIndex > 0;
  }

  /**
   * The index of the child view that should be drawn. This should be used in
   * {@link ViewGroup#getChildDrawingOrder}.
   */
  public int getChildDrawingOrder(int childCount, int index) {
    if (mDrawingOrderIndices == null) {
      ArrayList<View> viewsToSort = new ArrayList<>();
      for (int i = 0; i < childCount; i++) {
        viewsToSort.add(mViewGroup.getChildAt(i));
      }
      // Sort the views by zIndex
      Collections.sort(viewsToSort, new Comparator<View>() {
        @Override
        public int compare(View view1, View view2) {
          Integer view1ZIndex = ViewGroupManager.getViewZIndex(view1);
          if (view1ZIndex == null) {
            view1ZIndex = 0;
          }

          Integer view2ZIndex = ViewGroupManager.getViewZIndex(view2);
          if (view2ZIndex == null) {
            view2ZIndex = 0;
          }

          return view1ZIndex - view2ZIndex;
        }
      });

      mDrawingOrderIndices = new int[childCount];
      for (int i = 0; i < childCount; i++) {
        View child = viewsToSort.get(i);
        mDrawingOrderIndices[i] = mViewGroup.indexOfChild(child);
      }
    }
    return mDrawingOrderIndices[index];
  }

  /**
   * Recheck all children for z-index changes.
   */
  public void update() {
    mNumberOfChildrenWithZIndex = 0;
    for (int i = 0; i < mViewGroup.getChildCount(); i++) {
      if (ViewGroupManager.getViewZIndex(mViewGroup.getChildAt(i)) != null) {
        mNumberOfChildrenWithZIndex++;
      }
    }
    mDrawingOrderIndices = null;
  }
}
